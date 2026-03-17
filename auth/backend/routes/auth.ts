/**
 * 认证路由
 */
import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from '../config';
import UserModel from '../models/User';
import { generateTokenPair, verifyToken, TokenPayload } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// 初始化用户模型
const userModel = new UserModel(config.database.path);

// 配置 JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
    },
    (payload: TokenPayload, done) => {
      const user = userModel.getById(payload.userId);
      if (user) {
        return done(null, payload);
      }
      return done(null, false);
    }
  )
);

// 配置 Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const username = profile.displayName || profile.username || email?.split('@')[0] || 'user';
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email provided by Google'));
          }

          const user = await userModel.createOrUpdateOAuthUser(
            'google',
            profile.id,
            email,
            username,
            avatar
          );

          return done(null, {
            userId: user.id,
            email: user.email,
            username: user.username,
            provider: user.provider,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

// 配置 GitHub OAuth Strategy
if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackURL,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
          const username = profile.username || profile.displayName || email.split('@')[0];
          const avatar = profile.photos?.[0]?.value;

          const user = await userModel.createOrUpdateOAuthUser(
            'github',
            profile.id,
            email,
            username,
            avatar
          );

          return done(null, {
            userId: user.id,
            email: user.email,
            username: user.username,
            provider: user.provider,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

/**
 * POST /auth/register
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await userModel.createLocalUser(username, email, password);
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      provider: user.provider,
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
      tokens,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /auth/login
 * 用户名密码登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await userModel.verifyPassword(email, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      provider: user.provider,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
      },
      tokens,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/refresh
 * 刷新令牌
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = userModel.getById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = generateTokenPair(payload);
    res.json({ tokens });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/logout
 * 登出
 */
router.post('/logout', authenticate, (req: any, res: Response) => {
  // 在实际应用中，这里可以将刷新令牌加入黑名单
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, (req: any, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = userModel.getById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

/**
 * Google OAuth 路由
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as TokenPayload;
    const tokens = generateTokenPair(user);
    
    // 重定向到前端，带上令牌
    res.redirect(`${config.server.origin}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
);

/**
 * GitHub OAuth 路由
 */
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as TokenPayload;
    const tokens = generateTokenPair(user);
    
    res.redirect(`${config.server.origin}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
);

export default router;
export { userModel };
