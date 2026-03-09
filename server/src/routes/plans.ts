// 计划路由 - CRUD 操作
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取用户所有计划
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const [plans] = await pool.execute(
      'SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json(plans);
  } catch (error) {
    console.error('获取计划错误:', error);
    res.status(500).json({ error: '获取计划失败' });
  }
});

// 创建新计划
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { title, description, start_date, end_date, frequency } = req.body;

    if (!title || !start_date || !end_date) {
      res.status(400).json({ error: '标题、开始日期和结束日期不能为空' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO plans (user_id, title, description, start_date, end_date, frequency)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, start_date, end_date, frequency || 'daily']
    );

    const insertResult = result as { insertId: number };

    const [newPlan] = await pool.execute(
      'SELECT * FROM plans WHERE id = ?',
      [insertResult.insertId]
    );

    res.status(201).json((newPlan as any[])[0]);
  } catch (error) {
    console.error('创建计划错误:', error);
    res.status(500).json({ error: '创建计划失败' });
  }
});

// 更新计划
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;
    const { title, description, start_date, end_date, frequency } = req.body;

    // 检查计划是否存在且属于当前用户
    const [existingPlans] = await pool.execute(
      'SELECT * FROM plans WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!Array.isArray(existingPlans) || existingPlans.length === 0) {
      res.status(404).json({ error: '计划不存在' });
      return;
    }

    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (frequency !== undefined) {
      updates.push('frequency = ?');
      values.push(frequency);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' });
      return;
    }

    values.push(id, req.user.id);

    await pool.execute(
      `UPDATE plans SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updatedPlan] = await pool.execute(
      'SELECT * FROM plans WHERE id = ?',
      [id]
    );

    res.json((updatedPlan as any[])[0]);
  } catch (error) {
    console.error('更新计划错误:', error);
    res.status(500).json({ error: '更新计划失败' });
  }
});

// 删除计划（级联删除关联任务）
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { id } = req.params;

    // 检查计划是否存在且属于当前用户
    const [existingPlans] = await pool.execute(
      'SELECT * FROM plans WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!Array.isArray(existingPlans) || existingPlans.length === 0) {
      res.status(404).json({ error: '计划不存在' });
      return;
    }

    // 删除计划（由于外键设置了 ON DELETE CASCADE，关联任务会自动删除）
    await pool.execute(
      'DELETE FROM plans WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('删除计划错误:', error);
    res.status(500).json({ error: '删除计划失败' });
  }
});

export default router;