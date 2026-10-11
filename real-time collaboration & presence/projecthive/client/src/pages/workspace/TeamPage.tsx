import { useParams } from 'react-router-dom';
import { useWorkspace } from './WorkspaceLayout';
import { Avatar, Badge, PageSkeleton } from '../../components/ui';
import { UsersIcon } from '../../components/Icons';
import type { PresenceMember } from '../../types';

export default function TeamPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project, presence } = useWorkspace();
  if (!project) return <PageSkeleton rows={2} />;

  const members = project.members ?? [];
  const presenceOf = (userId: string): PresenceMember | undefined => presence.find((p) => p.userId === userId);
  const onlineCount = presence.filter((p) => p.online).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy-900">
            <UsersIcon size={20} className="text-indigo-500" /> Team
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {members.length} members · <span className="font-semibold text-emerald-600">{onlineCount} online now</span> (live via Socket.io presence)
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const live = presenceOf(member.id);
          const online = live?.online ?? false;
          return (
            <article key={member.id} className={`card p-5 transition ${online ? 'ring-1 ring-emerald-100' : ''}`}>
              <div className="flex items-start gap-3.5">
                <Avatar name={member.name} color={member.avatarColor} size="lg" online={online} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-bold text-navy-900">{member.name}</h3>
                  <p className="text-xs text-slate-400">{member.title ?? (member.membershipRole === 'supervisor' ? 'Project Supervisor' : 'Student')}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={member.membershipRole === 'supervisor' ? 'green' : 'indigo'}>{member.membershipRole === 'supervisor' ? 'Supervisor' : 'Student'}</Badge>
                    <Badge tone="slate">{member.department}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${online ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {online ? 'Online' : 'Offline'}
                </span>
                <span className="truncate text-[11.5px] font-medium text-indigo-500" title={live?.activity}>
                  {online ? `“${live?.activity ?? 'Viewing project'}”` : ''}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Presence updates instantly when members open or leave <span className="font-mono">project:{projectId}</span>.
      </p>
    </div>
  );
}
