// Express 应用配置
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { testConnection, initDatabase } from './config/database';

// 导入路由
import authRoutes from './routes/auth';
import plansRoutes from './routes/plans';
import tasksRoutes from './routes/tasks';
import schedulesRoutes from './routes/schedules';
import streakRoutes from './routes/streak';
import logRoutes from './routes/logs';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// JSON 解析
app.use(express.json());

// 请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

// 请求日志中间件
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// API 路由
app.use('/auth', authRoutes);
app.use('/plans', plansRoutes);
app.use('/tasks', tasksRoutes);
app.use('/schedules', schedulesRoutes);
app.use('/streak', streakRoutes);
app.use('/logs', logRoutes);

// 根路由 - 健康检查
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: '智远日程 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 添加请求日志
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
    stack: err.stack
  });
});

// 启动服务器
async function startServer() {
  try {
    // 加载环境变量
    require('dotenv').config();
    
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('数据库连接失败，程序退出');
      process.exit(1);
    }
    
    // 初始化数据库表
    await initDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📍 噪康检查: http://localhost:${PORT}`);
      console.log(`📡 API 地址: http://localhost:${PORT}`);
      console.log(`🌐 儿端 URL: ${process.env.API_BASE_URL || 'http://localhost:3000/api'}`);
    });
    
    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n⏹️ 正在关闭服务器...');
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      console.log('\n⏹️ 正在关闭服务器...');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动
startServer();