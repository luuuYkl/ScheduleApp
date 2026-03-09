// 签到路由 - 签到记录管理
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取用户签到记录
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const userId = req.params.userId;

    // 验证是否是当前用户
    if (parseInt(userId) !== req.user.id) {
      res.status(403).json({ error: '无权访问其他用户的签到记录' });
      return;
    }

    const [streaks] = await pool.execute(
      'SELECT * FROM streaks WHERE user_id = ?',
      [userId]
    );

    if (!Array.isArray(streaks) || streaks.length === 0) {
      // 如果没有记录则创建一个
      await pool.execute(
        'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)',
        [userId]
      );
      res.json({
        id: 0,
        user_id: parseInt(userId),
        current_streak: 0,
        longest_streak: 0,
        last_checkin: null,
      });
      return;
    }

    res.json((streaks as any[])[0]);
  } catch (error) {
    console.error('获取签到记录错误:', error);
    res.status(500).json({ error: '获取签到记录失败' });
  }
});

// 执行签到
router.post('/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: '用户ID不能为空' });
      return;
    }

    // 飀查是否是当前用户
    if (userId !== req.user.id) {
      res.status(403).json({ error: '无权为其他用户签到' });
      return;
    }

    // 获取当前签到记录
    const [streaks] = await pool.execute(
      'SELECT * FROM streaks WHERE user_id = ?',
      [userId]
    );

    let streak: any;
    if (!Array.isArray(streaks) || streaks.length === 0) {
      // 创建新的签到记录
      const [result] = await pool.execute(
        'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (?, 1, 1)',
        [userId]
      );
      const insertResult = result as { insertId: number };
      streak = {
        id: insertResult.insertId,
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_checkin: new Date().toISOString().split('T')[0],
      };
    } else {
      streak = (streaks as any[])[0];
    }

    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = streak.last_checkin;

    // 检查是否可以签到（同一天只能签一次)
    if (lastCheckin === today) {
      res.status(400).json({ error: '今天已经签到过了' });
      return;
    }

    // 计算连续签到天数
    let newStreak = streak.current_streak + 1;
    let newLongestStreak = Math.max(newStreak, streak.longest_streak);

    // 更新签到记录
    await pool.execute(
      'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_checkin = ? WHERE user_id = ?',
      [newStreak, newLongestStreak, today, userId]
    );

    // 获取更新后的记录
    const [updatedStreaks] = await pool.execute(
      'SELECT * FROM streaks WHERE user_id = ?',
      [userId]
    );

    res.json((updatedStreaks as any[])[0]);
  } catch (error) {
    console.error('签到错误:', error);
    res.status(500).json({ error: '签到失败' });
  }
});

export default router;