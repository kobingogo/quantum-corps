/**
 * 认证单元测试
 */
import { UserModel } from '../../backend/models/User';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../backend/utils/jwt';
import config from '../../backend/config';

describe('UserModel', () => {
  let userModel: UserModel;
  const testDbPath = ':memory:';

  beforeEach(() => {
    userModel = new UserModel(testDbPath);
  });

  afterEach(() => {
    userModel.close();
  });

  describe('createLocalUser', () => {
    it('should create a new user successfully', async () => {
      const user = await userModel.createLocalUser(
        'testuser',
        'test@example.com',
        'password123'
      );

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.provider).toBe('local');
      expect(user.id).toBeDefined();
      expect(user.password).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      await userModel.createLocalUser('user1', 'test@example.com', 'password123');
      
      await expect(
        userModel.createLocalUser('user2', 'test@example.com', 'password456')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('verifyPassword', () => {
    it('should return user for valid credentials', async () => {
      await userModel.createLocalUser('testuser', 'test@example.com', 'password123');
      
      const user = await userModel.verifyPassword('test@example.com', 'password123');
      
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(user?.password).toBeUndefined();
    });

    it('should return null for invalid password', async () => {
      await userModel.createLocalUser('testuser', 'test@example.com', 'password123');
      
      const user = await userModel.verifyPassword('test@example.com', 'wrongpassword');
      
      expect(user).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const user = await userModel.verifyPassword('nonexistent@example.com', 'password123');
      
      expect(user).toBeNull();
    });
  });

  describe('createOrUpdateOAuthUser', () => {
    it('should create new OAuth user', async () => {
      const user = await userModel.createOrUpdateOAuthUser(
        'google',
        'google-123',
        'oauth@example.com',
        'oauthuser',
        'https://avatar.com/pic.jpg'
      );

      expect(user.provider).toBe('google');
      expect(user.providerId).toBe('google-123');
      expect(user.email).toBe('oauth@example.com');
    });

    it('should update existing OAuth user', async () => {
      await userModel.createOrUpdateOAuthUser(
        'google',
        'google-123',
        'oauth@example.com',
        'oauthuser'
      );

      const updatedUser = await userModel.createOrUpdateOAuthUser(
        'google',
        'google-123',
        'newemail@example.com',
        'newusername',
        'https://newavatar.com/pic.jpg'
      );

      expect(updatedUser.email).toBe('newemail@example.com');
      expect(updatedUser.username).toBe('newusername');
    });
  });
});

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test-123',
    email: 'test@example.com',
    username: 'testuser',
    provider: 'local',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token with very short expiry
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(testPayload, config.jwt.secret, { expiresIn: '1ms' });
      
      // Wait for expiration
      setTimeout(() => {
        const decoded = verifyToken(expiredToken);
        expect(decoded).toBeNull();
      }, 10);
    });
  });
});
