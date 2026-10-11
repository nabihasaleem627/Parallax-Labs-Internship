import { Link } from 'react-router-dom';
import { formatDate } from '../utils/format';
import type { Project } from '../types';
import { Avatar, ProgressBar, StatusBadge } from './ui';
import { ClockIcon, FlagIcon } from './Icons';

export default function ProjectCard({ project }: { project: Project }) {
  const students = (project.members ?? []).filter((m) => m.membershipRole !== 'supervisor');
  return (
    <Link
      to={`/projects/${project.id}/overview`}
      className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">{project.category}</p>
          <h3 className="mt-0.5 truncate text-[15px] font-bold text-navy-900 group-hover:text-indigo-700">{project.title}</h3>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">{project.description}</p>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Progress</span>
          <span className="font-bold text-indigo-600">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
        <div className="flex -space-x-1.5">
          {students.slice(0, 4).map((m) => (
            <Avatar key={m.id} name={m.name} color={m.avatarColor} size="xs" title={m.name} />
          ))}
          {students.length > 4 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 ring-2 ring-white">
              +{students.length - 4}
            </span>
          )}
        </div>
        <span className="truncate font-medium">{project.supervisor?.name ?? 'No supervisor'}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <ClockIcon size={13} />
        <span>Deadline</span>
        <span className="font-semibold text-slate-600">{formatDate(project.deadline)}</span>
        <FlagIcon size={13} className="ml-2" />
        <span className="font-medium">{project.stats?.pendingTasks ?? 0} open tasks</span>
      </div>
    </Link>
  );
}
