import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout, { FieldError } from '../components/AuthLayout';
import { api } from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ message: string; demoResetToken?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ message: string; demoResetToken?: string }>('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to sign in
        </Link>
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
            <p className="font-semibold">{result.message}</p>
            {result.demoResetToken && (
              <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-emerald-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Demo mode — your reset token</p>
                <code className="mt-1 block break-all text-xs text-emerald-700">{result.demoResetToken}</code>
                <Link to={`/reset-password?token=${result.demoResetToken}`} className="btn-primary mt-3 w-full">
                  Continue to reset password →
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FieldError error={error} />
          <div>
            <label className="label" htmlFor="fp-email">Email</label>
            <input id="fp-email" type="email" required className="input" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
