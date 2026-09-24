import { createContext, useContext, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const AUTH_TOKEN_KEY = 'medai-auth-token';
const USER_KEY = 'medai-auth-user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = Boolean(token);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken || '');
    setUser(nextUser || null);

    if (nextToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const login = async (credentials = null) => {
    if (!credentials) {
      persistSession('mock-token', { email: 'demo@medai.local', name: 'Demo User' });
      return { token: 'mock-token', user: { email: 'demo@medai.local', name: 'Demo User' } };
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed.');
    }

    persistSession(data.token, data.user);
    return data;
  };

  const logout = () => {
    persistSession('', null);
  };

  const sendOtp = async (name, email) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Unable to send OTP.');
    }

    return data;
  };

  const verifyOtp = async (email, otpCode) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp_code: otpCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'OTP verification failed.');
    }

    return data;
  };

  const register = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed.');
    }

    persistSession(data.token, data.user);
    return data;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
      sendOtp,
      verifyOtp,
      register,
    }),
    [token, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
