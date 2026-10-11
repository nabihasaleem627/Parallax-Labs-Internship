import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace, WorkspaceCard } from './WorkspaceLayout';
import ActivityFeed from '../../components/ActivityFeed';
import { PageSkeleton } from '../../components/ui';
import type { ActivityItem } from '../../types';

export default function ActivityPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { liveActivities } = useWorkspace();
  const [history, setHistory] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    api.get<{ activities: ActivityItem[] }>(`/projects/${projectId}/activities`).then(({ activities }) => setHistory(activities)).catch(() => setHistory([]));
  }, [projectId]);

  const activities = useMemo(() => {
    const seen = new Set<string>();
    return [...liveActivities, ...(history ?? [])].filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [liveActivities, history]);

  if (!history) return <PageSkeleton rows={1} />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-navy-900">Activity History</h1>
        <p className="mt-0.5 text-[13px] text-slate-500">Everything that happened in this project — live events appear instantly at the top.</p>
      </div>
      <WorkspaceCard>
        <ActivityFeed activities={activities} />
      </WorkspaceCard>
    </div>
  );
}
