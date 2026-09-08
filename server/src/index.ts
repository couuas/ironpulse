import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabaseSchema } from './db/schema';
import { authRouter } from './routes/auth';
import { syncRouter } from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// 中间件配置
app.use(cors({
  origin: '*', // 允许自建 PWA、本地前端或任何客户端跨域接入
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 健康检查接口
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '0.0.2',
    name: 'IronPulse Self-Hosted API Server',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now()
  });
});

// 路由挂载
app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);

// 全局 404 处理
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的 API 路由不存在'
  });
});

// 全局异常捕获处理
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 未捕获的服务器异常:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部异常',
    error: err.message
  });
});

// 初始化数据表并启动服务器
async function startServer() {
  try {
    await initDatabaseSchema();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(`🚀 IronPulse API Server v0.0.2 运行中`);
      console.log(`📡 监听地址: http://0.0.0.0:${PORT}`);
      console.log(`🩺 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('💥 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
