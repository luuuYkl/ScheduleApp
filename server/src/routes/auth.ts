// 认证路由 - 登录、注册、获取用户信息
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { authMiddleware, generateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// 用户注册
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    // 检查用户名是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email || null, hashedPassword]
    );

    const insertResult = result as { insertId: number };
    const userId = insertResult.insertId;

    // 为新用户创建签到记录
    await pool.execute(
      'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES (?, 0, 0)',
      [userId]
    );

    // 生成 token
    const token = generateToken({ id: userId, username });

    res.status(201).json({
      id: userId,
      username,
      email: email || undefined,
      token,
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 用户登录
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    // 查询用户
    const [users] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE username = ?',
      [username]
    );

    if (!Array.isArray(users) || users.length === 0) {
      res.status(401).json({ error: '用户名不存在' });
      return;
    }

    const user = users[0] as { id: number; username: string; email: string; password: string };

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: '密码错误' });
      return;
    }

    // 生成 token
    const token = generateToken({ id: user.id, username: user.username });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息（需要认证）
router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const [users] = await pool.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const user = users[0] as { id: number; username: string; email: string; created_at: string };
    res.json({
      id: user.id,
      username: user.username,
      email: user.email || undefined,
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;