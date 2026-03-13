// JWT 认证中间件
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// 扩展 Request 类型
declare module 'express' {
  interface Request {
    user?: {
      id: number;
      username: string;
    };
  }
}

// 验证 JWT Token
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // 从 Header 获取 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: '未提供认证令牌' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: '令牌已过期' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: '无效的令牌' });
      return;
    }
    res.status(500).json({ error: '认证失败' });
  }
}

// 可选认证中间件（有 token 则验证，无 token 也放行）
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
      req.user = decoded;
    }
    next();
  } catch {
    // 忽略错误，继续执行
    next();
  }
}

// 生成 JWT Token
export function generateToken(payload: { id: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
