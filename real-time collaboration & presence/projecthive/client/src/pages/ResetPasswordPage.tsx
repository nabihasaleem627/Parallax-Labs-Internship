import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout, { FieldError } from '../components/AuthLayout';
import { api } from '../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      window.setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Paste the reset token from your email and pick a new password."
      footer={
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Password reset successfully. Redirecting to sign in…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FieldError error={error} />
          <div>
            <label className="label" htmlFor="rp-token">Reset token</label>
            <input id="rp-token" required className="input font-mono !text-xs" placeholder="Paste token" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rp-pass">New password</label>
              <input id="rp-pass" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="rp-confirm">Confirm password</label>
              <input id="rp-confirm" type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
