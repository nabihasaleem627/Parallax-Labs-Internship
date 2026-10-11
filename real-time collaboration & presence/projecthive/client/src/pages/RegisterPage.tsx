import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout, { FieldError } from '../components/AuthLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<string[]>(['Computer Science', 'Software Engineering', 'Electrical Engineering', 'Business Administration']);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student' as 'student' | 'supervisor', department: 'Computer Science' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ departments: { id: string; name: string }[] }>('/users/departments').then((d) => setDepartments(d.departments.map((x) => x.name))).catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role, department: form.department });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your team's collaborative workspace."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldError error={error} />
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required className="input" placeholder="e.g. Nabiha Saleem" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">University email</label>
          <input id="reg-email" type="email" required className="input" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" required minLength={8} className="input" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" type="password" required className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">I am a</span>
            <div className="grid grid-cols-2 gap-2">
              {(['student', 'supervisor'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition ${
                    form.role === role ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="reg-dep">Department</label>
            <select id="reg-dep" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
