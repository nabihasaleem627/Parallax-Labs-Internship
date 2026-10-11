import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace, WorkspaceCard } from './WorkspaceLayout';
import CommentsPanel from '../../components/CommentsPanel';
import ActivityFeed from '../../components/ActivityFeed';
import { Avatar, Badge, EmptyState, ProgressBar } from '../../components/ui';
import { CalendarIcon, CheckIcon, ClockIcon, FlagIcon } from '../../components/Icons';
import { formatDate, formatDateTime, isOverdue } from '../../utils/format';
import type { ActivityItem, CalendarEvent, Task } from '../../types';

export default function OverviewPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project, liveActivities } = useWorkspace();
  const [history, setHistory] = useState<ActivityItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.get<{ activities: ActivityItem[] }>(`/projects/${projectId}/activities`).then(({ activities }) => setHistory(activities)).catch(() => undefined);
    api.get<{ events: CalendarEvent[] }>(`/projects/${projectId}/calendar`).then(({ events }) => setCalendar(events)).catch(() => undefined);
    api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`).then(({ tasks }) => setTasks(tasks)).catch(() => undefined);
  }, [projectId]);

  const activities = useMemo(() => {
    const seen = new Set<string>();
    return [...liveActivities, ...history].filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [liveActivities, history]);

  const upcoming = calendar.filter((e) => new Date(e.date).getTime() >= Date.now() - 86_400_000).slice(0, 5);
  if (!project) return <EmptyState title="Loading project…" />;

  const students = (project.members ?? []).filter((m) => m.membershipRole !== 'supervisor');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-6 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">{project.category} · {project.department}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">{project.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">{project.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <span key={tech} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200 ring-1 ring-white/10">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
          <div>
            <p className="label !mb-1.5">Overall progress</p>
            <p className="text-3xl font-extrabold tracking-tight text-indigo-600">{project.progress}%</p>
            <ProgressBar value={project.progress} className="mt-2" />
            <p className="mt-1.5 text-[11px] text-slate-400">
              {tasks.filter((t) => t.status === 'completed').length} of {tasks.length} tasks completed
            </p>
          </div>
          <div>
            <p className="label !mb-1.5">Supervisor</p>
            {project.supervisor ? (
              <div className="flex items-center gap-2.5">
                <Avatar name={project.supervisor.name} color={project.supervisor.avatarColor} size="md" />
                <div>
                  <p className="text-sm font-bold text-navy-900">{project.supervisor.name}</p>
                  <p className="text-[11px] text-slate-400">{project.supervisor.title ?? 'Supervisor'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Not assigned</p>
            )}
          </div>
          <div>
            <p className="label !mb-1.5">Timeline</p>
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <CalendarIcon size={14} className="text-slate-400" /> Started {formatDate(project.startDate)}
            </p>
            <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${isOverdue(project.deadline) && project.status !== 'completed' ? 'text-rose-600' : 'text-navy-900'}`}>
              <FlagIcon size={14} /> Due {formatDate(project.deadline)}
            </p>
          </div>
          <div>
            <p className="label !mb-1.5">Team ({students.length} students)</p>
            <div className="flex flex-wrap gap-2">
              {students.map((m) => (
                <span key={m.id} className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-2.5 ring-1 ring-slate-200">
                  <Avatar name={m.name} color={m.avatarColor} size="xs" />
                  <span className="text-[11px] font-semibold text-slate-600">{m.name.split(' ')[0]}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Milestones */}
          <WorkspaceCard title="Milestones">
            {project.milestones.length === 0 ? (
              <p className="py-3 text-sm text-slate-400">No milestones defined yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
                {project.milestones.map((m) => (
                  <li key={m.id} className="relative">
                    <span
                      className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                        m.completed ? 'bg-emerald-500 text-white' : isOverdue(m.dueDate) ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {m.completed && <CheckIcon size={11} />}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold ${m.completed ? 'text-slate-400 line-through' : 'text-navy-900'}`}>{m.title}</p>
                      <Badge tone={m.completed ? 'green' : isOverdue(m.dueDate) ? 'red' : 'slate'}>{m.completed ? 'Completed' : formatDate(m.dueDate, { month: 'short', day: 'numeric' })}</Badge>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </WorkspaceCard>

          {/* Recent activity */}
          <WorkspaceCard
            title="Recent Activity"
            action={
              <Link to="../activity" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all →
              </Link>
            }
          >
            <ActivityFeed activities={activities} loading={history.length === 0 && liveActivities.length === 0} limit={6} />
          </WorkspaceCard>

          {/* Supervisor feedback */}
          <CommentsPanel projectId={projectId} targetType="project" targetId={projectId} title="Feedback & Discussion" />
        </div>

        <div className="space-y-6">
          {/* Upcoming deadlines */}
          <WorkspaceCard title={<span className="flex items-center gap-2"><ClockIcon size={14} className="text-indigo-500" /> Upcoming Deadlines</span>}>
            {upcoming.length === 0 ? (
              <p className="py-3 text-sm text-slate-400">Nothing due soon. 🎉</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                    <span
                      className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        e.type === 'deadline' ? 'bg-rose-500' : e.type === 'meeting' ? 'bg-indigo-500' : e.type === 'milestone' ? 'bg-amber-400' : 'bg-sky-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-navy-900">{e.title}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(e.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </WorkspaceCard>

          {/* Quick links */}
          <WorkspaceCard title="Jump into the work">
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '../notes', label: 'Collaborative Notes', desc: 'Edit live with your team' },
                { to: '../tasks', label: 'Task Board', desc: 'Kanban sprint view' },
                { to: '../research', label: 'Research', desc: 'Questions & methodology' },
                { to: '../meetings', label: 'Meetings', desc: 'Agendas & notes' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="rounded-lg border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <p className="text-[13px] font-bold text-navy-900">{link.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{link.desc}</p>
                </Link>
              ))}
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </div>
  );
}
