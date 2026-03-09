// 服务器入口文件
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

// 根路由 - 健康检查
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    name: '智远日程 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 健康检查端点
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 启动服务器
async function startServer() {
  try {
    console.log('========================================');
    console.log('🔧 环境变量配置:');
    console.log(`  - PORT: ${PORT}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  - JWT Secret: ${process.env.JWT_SECRET ? '已设置' : '使用默认值'}`);
    console.log(`  - Frontend URL: ${FRONTEND_URL}`);
    console.log(`  - Database Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log('========================================');

    // 测试数据库连接
    console.log('🔗 正在连接数据库...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 初始化数据库表
    console.log('📦 正在初始化数据库表...');
    await initDatabase();

    // 启动 HTTP 服务器
    app.listen(PORT, () => {
      console.log('========================================');
      console.log('🚀 智远日程 API 服务已启动');
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log('📋 可用端点:');
      console.log('   认证:');
      console.log('   - POST /auth/register  - 用户注册');
      console.log('   - POST /auth/login     - 用户登录');
      console.log('   - GET  /auth/profile   - 获取用户信息');
      console.log('   计划:');
      console.log('   - GET  /plans          - 获取计划列表');
      console.log('   - POST /plans          - 创建计划');
      console.log('   - PUT  /plans/:id      - 更新计划');
      console.log('   - DELETE /plans/:id    - 删除计划');
      console.log('   任务:');
      console.log('   - GET  /tasks          - 获取任务列表');
      console.log('   - POST /tasks          - 创建任务');
      console.log('   - PUT  /tasks/:id      - 更新任务');
      console.log('   - DELETE /tasks/:id    - 删除任务');
      console.log('   日程:');
      console.log('   - GET  /schedules      - 获取日程列表');
      console.log('   - POST /schedules      - 创建日程');
      console.log('   - PUT  /schedules/:id  - 更新日程');
      console.log('   - DELETE /schedules/:id - 删除日程');
      console.log('   签到:');
      console.log('   - GET  /streak/:userId - 获取签到记录');
      console.log('   - POST /streak/checkin - 执行签到');
      console.log('========================================');
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