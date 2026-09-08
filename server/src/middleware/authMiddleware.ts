import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'ironpulse_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  username?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: '未提供访问令牌或令牌格式错误 (Authorization: Bearer <Token>)'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. 优先校验极客免密 API Key (单租户极速通道)
  const envApiKey = process.env.IRONPULSE_API_KEY;
  if (envApiKey && token === envApiKey) {
    req.userId = 'usr_owner';
    req.username = 'owner';
    next();
    return;
  }

  // 2. 校验标准 JWT 令牌
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: '令牌已过期或无效，请重新登录',
      error: err.message
    });
  }
}
