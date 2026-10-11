import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout, { FieldError } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Nabiha — Student', email: 'nabiha@university.edu' },
  { label: 'Sarah — Student', email: 'sarah@university.edu' },
  { label: 'Dr. Ahmed — Supervisor', email: 'ahmed.khan@university.edu' },
  { label: 'Admin', email: 'admin@projecthive.edu' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ProjectHive workspace."
      footer={
        <>
          New to ProjectHive?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldError error={error} />
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="mb-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Demo accounts · password123</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword('password123');
                setError(null);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-[11.5px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
