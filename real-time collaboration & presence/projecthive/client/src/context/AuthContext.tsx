import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from '../api/client';
import { connectSocket, disconnectSocket, reconnectSocketWithToken } from '../realtime/socket';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: 'student' | 'supervisor'; department: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>('/auth/me')
      .then(({ user }) => {
        setUser(user);
        connectSocket();
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    reconnectSocketWithToken();
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string; role: 'student' | 'supervisor'; department: string }) => {
    const data = await api.post<{ token: string; user: User }>('/auth/register', input);
    setToken(data.token);
    setUser(data.user);
    reconnectSocketWithToken();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
