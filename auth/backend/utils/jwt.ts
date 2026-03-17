import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  provider: string;
}

/**
 * 生成 Access Token
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: '15m',
    issuer: 'auth-module',
  };
  
  return jwt.sign(payload as object, config.jwt.secret, options);
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: '7d',
    issuer: 'auth-module',
  };
  
  return jwt.sign(payload as object, config.jwt.secret, options);
}

/**
 * 验证 Token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & TokenPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      provider: decoded.provider,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 生成 Token 对（Access + Refresh）
 */
export function generateTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
