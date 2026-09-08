import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run } from '../db/db';
import { authMiddleware, AuthenticatedRequest, JWT_SECRET } from '../middleware/authMiddleware';

export const authRouter = Router();

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
}

/**
 * 注册新用户
 * POST /api/auth/register
 */
authRouter.post('/register', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: '用户名必须至少包含 3 个字符'
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: '密码长度必须至少为 6 个字符'
      });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // 检查用户名是否已存在
    const existing = await get<UserRow>('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing) {
      res.status(409).json({
        success: false,
        message: '该用户名已被注册，请尝试直接登录或更换用户名'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = Date.now();
    const userId = `usr_${now}_${Math.random().toString(36).substring(2, 8)}`;

    await run(
      'INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [userId, cleanUsername, passwordHash, now, now]
    );

    // 签发 365 天长期有效的 Token，极大改善离线/自建体验
    const token = jwt.sign(
      { userId, username: cleanUsername },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        createdAt: now
      }
    });
  } catch (error: any) {
    console.error('注册异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，注册失败',
      error: error.message
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await get<UserRow>('SELECT * FROM users WHERE username = ?', [cleanUsername]);

    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    console.error('登录异常:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误，登录失败',
      error: error.message
    });
  }
});

/**
 * 校验 Token 及获取当前用户信息
 * GET /api/auth/me
 */
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await get<UserRow>('SELECT id, username, created_at, updated_at FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

/**
 * 极客 API Key 免密验证与登录
 * POST /api/auth/api-key
 */
authRouter.post('/api-key', async (req, res): Promise<void> => {
  try {
    const { apiKey } = req.body;
    const serverKey = process.env.IRONPULSE_API_KEY;

    if (!serverKey) {
      res.status(400).json({
        success: false,
        message: '自建服务器端尚未配置 IRONPULSE_API_KEY 环境变量，请在环境变量中指定或使用账号密码登录'
      });
      return;
    }

    if (!apiKey || apiKey.trim() !== serverKey.trim()) {
      res.status(401).json({
        success: false,
        message: 'API Key 不匹配，请检查您在服务器端设置的密钥'
      });
      return;
    }

    res.json({
      success: true,
      message: 'API Key 校验成功，已连接私有主账号',
      token: serverKey.trim(),
      user: {
        id: 'usr_owner',
        username: 'owner (极客私有主账号)',
        createdAt: Date.now()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});
