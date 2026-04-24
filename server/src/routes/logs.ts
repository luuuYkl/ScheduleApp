// 日志路由 - AI 日志 CRUD + 自动生成
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取用户日志列表（可按日期范围过滤）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { startDate, endDate, limit } = req.query;
    let sql = 'SELECT * FROM logs WHERE user_id = ?';
    const params: any[] = [req.user.id];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY date DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
    } else {
      sql += ' LIMIT 90'; // 默认最近90天
    }

    const [logs] = await pool.execute(sql, params);
    res.json(logs);
  } catch (error) {
    console.error('获取日志错误:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// 获取指定日期的日志
router.get('/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { date } = req.params;
    const [logs] = await pool.execute(
      'SELECT * FROM logs WHERE user_id = ? AND date = ?',
      [req.user.id, date],
    );

    const logList = logs as any[];
    if (logList.length === 0) {
      res.status(404).json({ error: '该日期暂无日志' });
      return;
    }

    res.json(logList[0]);
  } catch (error) {
    console.error('获取日志错误:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// 手动触发日志生成（补偿机制）
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { date } = req.body;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    // 检查是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM logs WHERE user_id = ? AND date = ?',
      [req.user.id, targetDate],
    );

    if ((existing as any[]).length > 0) {
      res.json({ message: '该日期日志已存在', existing: true });
      return;
    }

    // 获取该日期的任务数据
    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
      [req.user.id, targetDate, targetDate],
    );

    // 获取该日期的日程
    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE user_id = ? AND date = ?',
      [req.user.id, targetDate],
    );

    // 生成日志（服务端简易版 — 直接从数据库统计数据）
    const taskList = tasks as any[];
    const scheduleList = schedules as any[];
    
    const tasksDone = taskList.filter(t => t.status === 'done').length;
    const tasksTotal = taskList.length;
    const schedulesDone = scheduleList.filter(s => s.completed).length;
    const schedulesTotal = scheduleList.length;

    // 构建日志内容
    let content = '';
    const doneTasks = taskList.filter(t => t.status === 'done');
    const pendingTasks = taskList.filter(t => t.status === 'pending');
    const missedTasks = taskList.filter(t => t.status === 'missed');

    if (tasksDone + schedulesDone === 0) {
      content = '今天还没有完成任何任务或日程。';
    } else {
      content = '完成了：';
      for (const t of doneTasks) {
        content += `\n✓ ${t.title}`;
      }
      for (const s of scheduleList.filter(s => s.completed)) {
        content += `\n✓ ${s.title}`;
      }
      const rate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
      content += `\n完成率 ${rate}%`;
    }

    // 情绪推断
    let mood = 'calm';
    const rate = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
    if (rate >= 0.9) mood = 'happy';
    else if (rate >= 0.7) mood = 'calm';
    else if (rate >= 0.5) mood = 'focused';
    else if (tasksDone === 0) mood = 'tired';
    else mood = 'stressed';

    // 插入数据库
    await pool.execute(
      `INSERT INTO logs (user_id, date, content, tasks_done, tasks_total, schedules_done, schedules_total, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content), tasks_done = VALUES(tasks_done), tasks_total = VALUES(tasks_total),
         schedules_done = VALUES(schedules_done), schedules_total = VALUES(schedules_total), mood = VALUES(mood)`,
      [req.user.id, targetDate, content, tasksDone, tasksTotal, schedulesDone, schedulesTotal, mood],
    );

    const [newLog] = await pool.execute(
      'SELECT * FROM logs WHERE user_id = ? AND date = ?',
      [req.user.id, targetDate],
    );

    res.status(201).json((newLog as any[])[0]);
  } catch (error) {
    console.error('生成日志错误:', error);
    res.status(500).json({ error: '生成日志失败' });
  }
});

export default router;