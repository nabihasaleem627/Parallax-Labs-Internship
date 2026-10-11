import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace } from './WorkspaceLayout';
import DocWorkspace from '../../components/DocWorkspace';
import { Avatar, Badge, EmptyState, Modal, PageSkeleton } from '../../components/ui';
import { CalendarIcon, ClockIcon, PlusIcon, VideoIcon } from '../../components/Icons';
import { formatDateTime, formatTime } from '../../utils/format';
import type { Meeting } from '../../types';

export default function MeetingsPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project, presence } = useWorkspace();
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [openNotesFor, setOpenNotesFor] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    api.get<{ meetings: Meeting[] }>(`/projects/${projectId}/meetings`).then(({ meetings }) => setMeetings(meetings)).catch(() => setMeetings([]));
  }, [projectId]);

  useEffect(load, [load]);

  const openNotes = async (meeting: Meeting) => {
    const { meeting: updated } = await api.post<{ meeting: Meeting }>(`/projects/${projectId}/meetings/${meeting.id}/notes`).catch(() => ({ meeting }));
    setOpenNotesFor(updated);
    load();
  };

  if (!meetings || !project) return <PageSkeleton rows={2} />;
  const upcoming = meetings.filter((m) => m.status === 'upcoming' && new Date(m.scheduledAt).getTime() >= Date.now() - 3_600_000);
  const past = meetings.filter((m) => !upcoming.includes(m));
  const supervisor = project.supervisor;

  const renderMeeting = (meeting: Meeting, isPast: boolean) => (
    <article key={meeting.id} className={`card p-5 ${isPast ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${isPast ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <VideoIcon size={19} />
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-navy-900">{meeting.title}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon size={12} /> {formatDateTime(meeting.scheduledAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ClockIcon size={12} /> {meeting.durationMinutes} min
              </span>
            </p>
          </div>
        </div>
        <Badge tone={isPast ? 'slate' : 'green'}>{isPast ? 'Completed' : 'Upcoming'}</Badge>
      </div>

      {meeting.supervisorId && supervisor && (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <Avatar name={supervisor.name} color={supervisor.avatarColor} size="xs" />
          <span className="text-xs text-slate-500">Supervisor:</span>
          <span className="text-xs font-bold text-navy-900">{supervisor.name}</span>
        </div>
      )}

      {meeting.agenda.length > 0 && (
        <div className="mt-3.5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Agenda</p>
          <ul className="space-y-1">
            {meeting.agenda.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-[13px] text-slate-600">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-indigo-50 text-[10px] font-bold text-indigo-600" style={{ height: 18, width: 18 }}>{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3.5">
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => openNotes(meeting)}>
          {meeting.notesDocumentId ? 'Open meeting notes' : 'Start collaborative notes'}
        </button>
        {!isPast && (
          <button
            className="btn-ghost !px-2.5 !py-1.5 text-xs text-emerald-600 hover:bg-emerald-50"
            onClick={async () => {
              await api.patch(`/projects/${projectId}/meetings/${meeting.id}`, { status: 'completed' }).catch(() => undefined);
              load();
            }}
          >
            Mark completed
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-900">Meetings</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">{upcoming.length} upcoming · notes are collaboratively edited in real time</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <PlusIcon size={15} /> Schedule Meeting
        </button>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Upcoming Meetings</h2>
      {upcoming.length === 0 ? (
        <EmptyState icon={<VideoIcon size={22} />} title="No upcoming meetings" description="Schedule your next supervisor check-in or team sync." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{upcoming.map((m) => renderMeeting(m, false))}</div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wider text-slate-400">Past Meetings</h2>
          <div className="grid gap-4 lg:grid-cols-2">{past.map((m) => renderMeeting(m, true))}</div>
        </>
      )}

      {openNotesFor?.notesDocumentId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/50 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && setOpenNotesFor(null)}>
          <div className="mx-auto max-w-4xl animate-fade-in rounded-2xl bg-slate-50 p-4 shadow-pop sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-navy-900">Collaborative meeting notes · {formatTime(openNotesFor.scheduledAt)}</p>
              <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setOpenNotesFor(null)}>Close</button>
            </div>
            <DocWorkspace projectId={projectId} documentId={openNotesFor.notesDocumentId} title={openNotesFor.title} presence={presence} />
          </div>
        </div>
      )}

      <CreateMeetingModal open={showCreate} onClose={() => setShowCreate(false)} projectId={projectId} onCreated={load} />
    </div>
  );
}

function CreateMeetingModal({ open, onClose, projectId, onCreated }: { open: boolean; onClose: () => void; projectId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [agenda, setAgenda] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await api
      .post(`/projects/${projectId}/meetings`, {
        title,
        scheduledAt: new Date(`${date}T${time}:00Z`).toISOString(),
        durationMinutes: duration,
        agenda: agenda.split('\n').map((a) => a.trim()).filter(Boolean),
      })
      .catch(() => undefined);
    setBusy(false);
    onCreated();
    onClose();
    setTitle('');
    setAgenda('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule Meeting">
      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label className="label" htmlFor="mt-title">Title</label>
          <input id="mt-title" required className="input" placeholder="e.g. Supervisor Meeting" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="mt-date">Date</label>
            <input id="mt-date" type="date" required className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="mt-time">Time</label>
            <input id="mt-time" type="time" required className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="mt-dur">Minutes</label>
            <input id="mt-dur" type="number" min={5} max={480} className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="mt-agenda">Agenda (one item per line)</label>
          <textarea id="mt-agenda" className="input min-h-24" placeholder={'Literature Review\nSystem Architecture\nWeek 4 Progress'} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy || !title || !date}>
          {busy ? 'Scheduling…' : 'Schedule Meeting'}
        </button>
      </form>
    </Modal>
  );
}
