import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HexagonIcon } from './Icons';

export default function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
            <HexagonIcon size={20} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Project<span className="text-indigo-400">Hive</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            One Workspace. One Team.
            <span className="block text-indigo-400">Real-Time Collaboration.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Manage Final Year Projects, research notes, tasks, documents and meetings with your team and supervisor — together, at the same time.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            {[
              'See who is online and who is typing — live',
              'Edit project notes together with instant sync',
              'Auto-save with conflict detection, never silent overwrites',
              'Keep working offline; changes sync on reconnect',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 ProjectHive · Full Stack Web Development Internship Project</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-indigo-300">
              <HexagonIcon size={17} />
            </span>
            <span className="text-base font-extrabold text-navy-900">
              Project<span className="text-indigo-600">Hive</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy-900">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function FieldError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200" role="alert">
      {error}
    </div>
  );
}
