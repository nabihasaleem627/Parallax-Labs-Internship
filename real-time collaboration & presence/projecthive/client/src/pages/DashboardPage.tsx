import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import ProjectCard from '../components/ProjectCard';
import { Avatar, Badge, CardSkeleton, EmptyState, ErrorState } from '../components/ui';
import { CalendarIcon, CheckIcon, ClockIcon, FolderIcon, NotesIcon, PlusIcon, VideoIcon } from '../components/Icons';
import { formatDate, formatTime, isOverdue } from '../utils/format';
import type { Meeting, Project, Task, User } from '../types';
import { Modal } from '../components/ui';

interface DashboardData {
  stats: { activeProjects: number; completedProjects: number; pendingTasks: number; upcomingMeetings: number };
  projects: Project[];
  upcomingMeetings: (Meeting & { projectTitle: string })[];
  myTasks: (Task & { projectTitle: string })[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setError(null);
    api
      .get<DashboardData>('/projects/dashboard')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const stats = [
    { label: 'Active Projects', value: data?.stats.activeProjects ?? 0, icon: FolderIcon, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Completed Projects', value: data?.stats.completedProjects ?? 0, icon: CheckIcon, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending Tasks', value: data?.stats.pendingTasks ?? 0, icon: NotesIcon, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Upcoming Meetings', value: data?.stats.upcomingMeetings ?? 0, icon: VideoIcon, tone: 'text-sky-600 bg-sky-50' },
  ];

  return (
    <div className="min-h-screen">
      <TopBar>Dashboard</TopBar>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">
              Welcome back, {user?.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">Here's what's happening across your projects today.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <PlusIcon size={15} /> Create Project
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: IconComp, tone }) => (
            <div key={label} className="card flex items-center gap-3.5 p-4 sm:p-5">
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <IconComp size={19} />
              </span>
              <div className="min-w-0">
                {!data ? (
                  <div className="h-7 w-10 animate-pulse rounded bg-slate-200" />
                ) : (
                  <p className="text-2xl font-extrabold tracking-tight text-navy-900">{value}</p>
                )}
                <p className="truncate text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {error && <ErrorState message={error} onRetry={load} />}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* My projects */}
          <section className="lg:col-span-2">
            <h2 className="mb-3.5 text-sm font-bold uppercase tracking-wider text-slate-400">My Projects</h2>
            {!data && !error ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : data && data.projects.length === 0 ? (
              <EmptyState
                icon={<FolderIcon size={22} />}
                title="No projects yet"
                description="Create a project or join an existing team to get started."
                action={
                  <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    <PlusIcon size={15} /> Create Project
                  </button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data?.projects.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            )}
          </section>

          {/* Right rail */}
          <div className="space-y-6">
            <section className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
                <VideoIcon size={15} className="text-indigo-500" /> Upcoming Meetings
              </h2>
              {!data ? (
                <div className="space-y-2">
                  <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : data.upcomingMeetings.length === 0 ? (
                <p className="py-3 text-sm text-slate-400">No meetings scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {data.upcomingMeetings.map((meeting) => (
                    <li key={meeting.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <p className="text-[13px] font-semibold text-navy-900">{meeting.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarIcon size={11} /> {formatDate(meeting.scheduledAt)} · {formatTime(meeting.scheduledAt)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">{meeting.projectTitle}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
                <ClockIcon size={15} className="text-indigo-500" /> My Open Tasks
              </h2>
              {!data ? (
                <div className="space-y-2">
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : data.myTasks.length === 0 ? (
                <p className="py-3 text-sm text-slate-400">Nothing assigned to you right now.</p>
              ) : (
                <ul className="space-y-2">
                  {data.myTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-navy-900">{task.title}</p>
                        <p className="truncate text-[11px] text-slate-400">{task.projectTitle}</p>
                      </div>
                      {task.deadline && (
                        <Badge tone={isOverdue(task.deadline) ? 'red' : 'slate'}>{formatDate(task.deadline, { month: 'short', day: 'numeric' })}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {user?.role === 'supervisor' && (
              <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <h2 className="text-sm font-bold text-indigo-900">Supervisor view</h2>
                <p className="mt-1 text-xs leading-relaxed text-indigo-700/80">
                  Open any assigned project to review progress, add feedback in the activity stream and co-edit research notes with your teams in real time.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
}

/* ------------------------------ Create project ------------------------------ */

function CreateProjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Final Year Project',
    departmentId: '',
    supervisorId: '',
    startDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    techStack: '',
    memberIds: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    api.get<{ supervisors: User[] }>('/users/supervisors').then((d) => setSupervisors(d.supervisors)).catch(() => undefined);
    api.get<{ students: User[] }>('/users/students').then((d) => setStudents(d.students)).catch(() => undefined);
    api.get<{ departments: { id: string; name: string }[] }>('/users/departments').then((d) => setDepartments(d.departments)).catch(() => undefined);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/projects', {
        ...form,
        startDate: new Date(`${form.startDate}T09:00:00Z`).toISOString(),
        deadline: new Date(`${form.deadline}T17:00:00Z`).toISOString(),
        techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Project">
      <form onSubmit={submit} className="space-y-3.5">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        <div>
          <label className="label" htmlFor="cp-title">Project title</label>
          <input id="cp-title" required className="input" placeholder="e.g. Smart Campus Assistant" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="cp-desc">Description</label>
          <textarea id="cp-desc" required minLength={10} className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="cp-cat">Category</label>
            <select id="cp-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Final Year Project</option>
              <option>Course Project</option>
              <option>Research Project</option>
              <option>Assignment</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cp-dep">Department</label>
            <select id="cp-dep" required className="input" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="" disabled>Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cp-start">Start date</label>
            <input id="cp-start" type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cp-deadline">Deadline</label>
            <input id="cp-deadline" type="date" required className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="cp-sup">Supervisor</label>
          <select id="cp-sup" required className="input" value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>
            <option value="" disabled>Select supervisor…</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cp-tech">Technology stack (comma separated)</label>
          <input id="cp-tech" className="input" placeholder="React, Node.js, PostgreSQL" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
        </div>
        <div>
          <span className="label">Team members</span>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => {
              const selected = form.memberIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, memberIds: selected ? form.memberIds.filter((id) => id !== s.id) : [...form.memberIds, s.id] })}
                  className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold transition ${
                    selected ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Avatar name={s.name} color={s.avatarColor} size="xs" />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
          {busy ? 'Creating…' : 'Create Project'}
        </button>
      </form>
    </Modal>
  );
}
