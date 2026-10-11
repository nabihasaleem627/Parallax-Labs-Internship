import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace, WorkspaceCard } from './WorkspaceLayout';
import DocWorkspace from '../../components/DocWorkspace';
import CommentsPanel from '../../components/CommentsPanel';
import ActivityFeed from '../../components/ActivityFeed';
import { Avatar, PageSkeleton } from '../../components/ui';
import { PulseIcon } from '../../components/Icons';
import type { ActivityItem, CollaborativeDocument } from '../../types';

export default function NotesPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { presence, liveActivities, banner } = useWorkspace();
  const [documents, setDocuments] = useState<CollaborativeDocument[] | null>(null);
  const [history, setHistory] = useState<ActivityItem[]>([]);

  useEffect(() => {
    api
      .get<{ documents: CollaborativeDocument[] }>(`/projects/${projectId}/documents`)
      .then(({ documents }) => setDocuments(documents.filter((d) => d.kind === 'notes')))
      .catch(() => setDocuments([]));
    api
      .get<{ activities: ActivityItem[] }>(`/projects/${projectId}/activities`)
      .then(({ activities }) => setHistory(activities))
      .catch(() => undefined);
  }, [projectId]);

  const notesDoc = documents?.[0];
  const mergedActivities = useMemo(() => {
    const seen = new Set<string>();
    return [...liveActivities, ...history].filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [liveActivities, history]);

  if (!documents) return <PageSkeleton rows={1} />;
  if (!notesDoc) {
    return (
      <WorkspaceCard>
        <p className="py-8 text-center text-sm text-slate-400">This project has no collaborative notes document yet.</p>
      </WorkspaceCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <DocWorkspace projectId={projectId} documentId={notesDoc.id} title="Project Research Notes" presence={presence} />
        <div className="mt-5">
          <CommentsPanel projectId={projectId} targetType="document" targetId={notesDoc.id} title="Discussion" />
        </div>
      </div>

      {/* Live side panel */}
      <div className="space-y-5">
        <WorkspaceCard title="In this project room">
          <ul className="space-y-2.5">
            {(presence.length ? presence : []).map((m) => (
              <li key={m.userId} className="flex items-center gap-2.5">
                <Avatar name={m.name} color={m.avatarColor} size="sm" online={m.online} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-navy-900">{m.name}</p>
                  <p className={`truncate text-[11px] ${m.online ? 'text-indigo-500' : 'text-slate-400'}`}>{m.online ? m.activity : 'Offline'}</p>
                </div>
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${m.online ? 'bg-emerald-500' : 'bg-slate-300'}`} title={m.online ? 'Online' : 'Offline'} />
              </li>
            ))}
          </ul>
          {banner.kind === 'synced' && <p className="mt-3 text-[11px] font-semibold text-emerald-600">✓ All changes synchronized</p>}
        </WorkspaceCard>

        <WorkspaceCard title={<span className="flex items-center gap-2"><PulseIcon size={14} className="text-indigo-500" /> Live Activity</span>}>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <ActivityFeed activities={mergedActivities} limit={14} />
          </div>
        </WorkspaceCard>
      </div>
    </div>
  );
}
