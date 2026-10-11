import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace } from './WorkspaceLayout';
import CalendarView from '../../components/CalendarView';
import { PageSkeleton } from '../../components/ui';
import type { CalendarEvent } from '../../types';

export default function CalendarPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project } = useWorkspace();
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    api.get<{ events: CalendarEvent[] }>(`/projects/${projectId}/calendar`).then(({ events }) => setEvents(events)).catch(() => setEvents([]));
  }, [projectId]);

  if (!events || !project) return <PageSkeleton rows={1} />;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-navy-900">Project Calendar</h1>
        <p className="mt-0.5 text-[13px] text-slate-500">Deadlines, meetings, milestones and task due dates in one view.</p>
      </div>
      <CalendarView events={events} />
    </div>
  );
}
