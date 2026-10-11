import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import TopBar from '../components/TopBar';
import { Avatar, Badge, ErrorState, PageSkeleton, ProgressBar } from '../components/ui';
import { FolderIcon, PulseIcon, UsersIcon } from '../components/Icons';
import { formatDate, relativeTime } from '../utils/format';
import type { Department, Project, Role, User } from '../types';

export default function AdminPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'users' | 'projects' | 'departments'>('users');

  const load = useCallback(() => {
    Promise.all([
      api.get<{ users: User[] }>('/users'),
      api.get<{ projects: Project[] }>('/projects'),
      api.get<{ departments: Department[] }>('/users/departments'),
    ])
      .then(([u, p, d]) => {
        setUsers(u.users);
        setProjects(p.projects);
        setDepartments(d.departments);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const changeRole = async (userId: string, role: Role) => {
    await api.patch(`/users/${userId}`, { role }).catch(() => undefined);
    load();
  };

  if (error && !users) {
    return (
      <div className="min-h-screen">
        <TopBar>Admin Console</TopBar>
        <main className="mx-auto max-w-5xl px-4 py-10">
          <ErrorState message={error} onRetry={load} />
        </main>
      </div>
    );
  }
  if (!users || !projects) {
    return (
      <div className="min-h-screen">
        <TopBar>Admin Console</TopBar>
        <main className="mx-auto max-w-5xl px-4 py-10">
          <PageSkeleton rows={3} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar>Admin Console</TopBar>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Admin Console</h1>
        <p className="mt-1 text-sm text-slate-500">Manage users, projects and departments across the system.</p>

        <div className="mt-5 mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Users', value: users.length, icon: UsersIcon },
            { label: 'Projects', value: projects.length, icon: FolderIcon },
            { label: 'Departments', value: departments.length, icon: PulseIcon },
          ].map(({ label, value, icon: IconComp }) => (
            <div key={label} className="card flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-indigo-300">
                <IconComp size={16} />
              </span>
              <div>
                <p className="text-xl font-extrabold text-navy-900">{value}</p>
                <p className="text-[11px] font-medium text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['users', 'projects', 'departments'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${tab === t ? 'bg-white text-navy-900 shadow-card' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div className="card divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} color={user.avatarColor} size="sm" />
                        <div>
                          <p className="text-[13.5px] font-semibold text-navy-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-500">{user.department}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-400"
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value as Role)}
                        aria-label={`Role for ${user.name}`}
                      >
                        <option value="student">student</option>
                        <option value="supervisor">supervisor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'projects' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/projects/${project.id}/overview`} className="text-[15px] font-bold text-navy-900 hover:text-indigo-600">
                      {project.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {project.category} · {(project.members ?? []).length} members
                    </p>
                  </div>
                  <Badge tone={project.status === 'active' ? 'green' : project.status === 'completed' ? 'indigo' : 'amber'}>{project.status}</Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                </div>
                <p className="mt-3 text-[11px] text-slate-400">Updated {relativeTime(project.updatedAt)} · deadline {formatDate(project.deadline)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'departments' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((department) => (
              <div key={department.id} className="card p-5 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FolderIcon size={19} />
                </span>
                <p className="text-sm font-bold text-navy-900">{department.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {users.filter((u) => u.department === department.name).length} users
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
