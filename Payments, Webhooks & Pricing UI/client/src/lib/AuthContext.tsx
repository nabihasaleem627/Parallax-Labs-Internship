import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEMO_MODE } from './api';

type User = { id: string; name: string; email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER'; tenantName: string };
type AuthContextValue = { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);
const demoUser: User = { id: 'usr_demo', name: 'Alex Morgan', email: 'alex@northstar.co', role: 'OWNER', tenantName: 'Northstar Studio' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('bookflow_user');
    if (stored) try { return JSON.parse(stored); } catch { /* ignore */ }
    return DEMO_MODE ? demoUser : null;
  });

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async (email, password) => {
      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 700));
        if (!email || password.length < 6) throw new Error('Enter a valid email and password.');
        localStorage.setItem('bookflow_token', 'demo-token');
        localStorage.setItem('bookflow_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to sign in.');
      localStorage.setItem('bookflow_token', body.data.token);
      localStorage.setItem('bookflow_user', JSON.stringify(body.data.user));
      setUser(body.data.user);
    },
    logout: () => { localStorage.removeItem('bookflow_token'); localStorage.removeItem('bookflow_user'); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
