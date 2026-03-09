// 日程路由 - CRUD 操作
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取日程列表（可按日期过滤)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { date } = req.query;
    let sql = 'SELECT * FROM schedules WHERE user_id = ?';
    const params: any[] = [req.user.id];

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }

    sql += ' ORDER BY date ASC, start_time ASC';

    const [schedules] = await pool.execute(sql, params);
    res.json(schedules);
  } catch (error) {
    console.error('获取日程错误:', error);
    res.status(500).json({ error: '获取日程失败' });
  }
});

// 创建新日程
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { title, date, start_time, end_time, description, completed } = req.body;

    if (!title || !date) {
      res.status(400).json({ error: '标题和日期不能为空' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO schedules (user_id, title, date, start_time, end_time, description, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, date, start_time || null, end_time || null, description || null, completed || false]
    );

    const insertResult = result as { insertId: number };
    const [newSchedule] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [insertResult.insertId]);

    res.status(201).json((newSchedule as any[])[0]);
  } catch (error) {
    console.error('创建日程错误:', error);
    res.status(500).json({ error: '创建日程失败' });
  }
});

// 更新日程
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { title, date, start_time, end_time, description, completed } = req.body;

    // 检查日程是否存在且属于当前用户
    const [existingSchedules] = await pool.execute(
      'SELECT * FROM schedules WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!Array.isArray(existingSchedules) || existingSchedules.length === 0) {
      res.status(404).json({ error: '日程不存在' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (date !== undefined) { updates.push('date = ?'); values.push(date); }
    if (start_time !== undefined) { updates.push('start_time = ?'); values.push(start_time); }
    if (end_time !== undefined) { updates.push('end_time = ?'); values.push(end_time); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (completed !== undefined) { updates.push('completed = ?'); values.push(completed); }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' });
      return;
    }

    values.push(id, req.user.id);
    await pool.execute(
      `UPDATE schedules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updatedSchedule] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [id]);
    res.json((updatedSchedule as any[])[0]);
  } catch (error) {
    console.error('更新日程错误:', error);
    res.status(500).json({ error: '更新日程失败' });
  }
});

// 删除日程
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM schedules WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    const deleteResult = result as { affectedRows: number };
    if (deleteResult.affectedRows === 0) {
      res.status(404).json({ error: '日程不存在' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除日程错误:', error);
    res.status(500).json({ error: '删除日程失败' });
  }
});

export default router;