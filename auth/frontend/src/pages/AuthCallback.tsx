/**
 * OAuth 回调页面
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      // 存储令牌
      localStorage.setItem('tokens', JSON.stringify({
        accessToken: token,
        refreshToken,
      }));

      // 获取用户信息
      fetch('http://localhost:3001/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to get user info');
          return res.json();
        })
        .then((data) => {
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        })
        .catch((err) => {
          setError('Authentication failed. Please try again.');
          console.error(err);
        });
    } else {
      setError('Invalid authentication response.');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {error ? (
        <>
          <div style={{ color: '#c33', fontSize: '18px' }}>{error}</div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            返回登录
          </button>
        </>
      ) : (
        <div style={{ fontSize: '18px', color: '#666' }}>
          正在登录...
        </div>
      )}
    </div>
  );
}

export default AuthCallback;
