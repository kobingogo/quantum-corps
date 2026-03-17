/**
 * 认证上下文
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  provider: 'local' | 'google' | 'github';
  avatar?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 初始化时检查本地存储
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokens = localStorage.getItem('tokens');
        const user = localStorage.getItem('user');

        if (tokens && user) {
          const parsedTokens = JSON.parse(tokens) as Tokens;
          const parsedUser = JSON.parse(user) as User;

          // 验证令牌是否有效
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${parsedTokens.accessToken}`,
            },
          });

          if (response.ok) {
            setState({
              user: parsedUser,
              tokens: parsedTokens,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // 尝试刷新令牌
          try {
            await refreshAccessToken(parsedTokens.refreshToken);
          } catch {
            // 刷新失败，清除状态
            localStorage.removeItem('tokens');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const refreshAccessToken = async (refreshToken: string) => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newTokens = data.tokens;
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setState({
      user,
      tokens: newTokens,
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('tokens', JSON.stringify(newTokens));
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    setState({
      user: data.user,
      tokens: data.tokens,
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('tokens', JSON.stringify(data.tokens));
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    
    setState({
      user: data.user,
      tokens: data.tokens,
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('tokens', JSON.stringify(data.tokens));
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });

    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const loginWithGitHub = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const refreshToken = async () => {
    if (!state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    await refreshAccessToken(state.tokens.refreshToken);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithGitHub,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
