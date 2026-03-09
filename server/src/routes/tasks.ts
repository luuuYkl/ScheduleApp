// 任务路由 - CRUD 操作
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取任务列表（可按计划ID过滤）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { planId } = req.query;
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: any[] = [req.user.id];

    if (planId) {
      sql += ' AND plan_id = ?';
      params.push(planId);
    }

    sql += ' ORDER BY task_date ASC, created_at DESC';

    const [tasks] = await pool.execute(sql, params);
    res.json(tasks);
  } catch (error) {
    console.error('获取任务错误:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建新任务
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { plan_id, title, task_date, start_time, end_time, status, note, repeat_type, repeat_end_date } = req.body;

    if (!plan_id || !title || !task_date) {
      res.status(400).json({ error: '计划ID、标题和任务日期不能为空' });
      return;
    }

    // 验证计划是否属于当前用户
    const [plans] = await pool.execute(
      'SELECT id FROM plans WHERE id = ? AND user_id = ?',
      [plan_id, req.user.id]
    );

    if (!Array.isArray(plans) || plans.length === 0) {
      res.status(400).json({ error: '计划不存在或无权限' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (plan_id, user_id, title, task_date, start_time, end_time, status, note, repeat_type, repeat_end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [plan_id, req.user.id, title, task_date, start_time || null, end_time || null, status || 'pending', note || null, repeat_type || 'none', repeat_end_date || null]
    );

    const insertResult = result as { insertId: number };
    const [newTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [insertResult.insertId]);

    res.status(201).json((newTask as any[])[0]);
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 更新任务
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { title, task_date, start_time, end_time, status, note, repeat_type, repeat_end_date } = req.body;

    // 检查任务是否存在且属于当前用户
    const [existingTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!Array.isArray(existingTasks) || existingTasks.length === 0) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }

    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (task_date !== undefined) { updates.push('task_date = ?'); values.push(task_date); }
    if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time); }
    if (end_time !== undefined) { updates.push('end_time = ?'); values.push(end_time); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (note !== undefined) { updates.push('note = ?'); values.push(note); }
    if (repeat_type !== undefined) { updates.push('repeat_type = ?'); values.push(repeat_type); }
    if (repeat_end_date !== undefined) { updates.push('repeat_end_date = ?'); values.push(repeat_end_date); }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有提供更新内容' });
      return;
    }

    values.push(id, req.user.id);
    await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updatedTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json((updatedTask as any[])[0]);
  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({ error: '更新任务失败' });
  }
});

// 更新任务状态（快捷方法）
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'done', 'missed'].includes(status)) {
      res.status(400).json({ error: '无效的状态值' });
      return;
    }

    const [existingTasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!Array.isArray(existingTasks) || existingTasks.length === 0) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }

    await pool.execute('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?', [status, id, req.user.id]);

    const [updatedTask] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json((updatedTask as any[])[0]);
  } catch (error) {
    console.error('更新任务状态错误:', error);
    res.status(500).json({ error: '更新任务状态失败' });
  }
});

// 删除任务
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    const deleteResult = result as { affectedRows: number };
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

export default router;