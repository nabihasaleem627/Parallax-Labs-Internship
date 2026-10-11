import { useState } from 'react';
import { api } from '../api/client';
import { formatDate, isOverdue } from '../utils/format';
import type { Task, TaskStatus, User } from '../types';
import { Avatar, Badge, Modal, StatusBadge } from './ui';
import { CommentIcon, PlusIcon } from './Icons';

const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: 'backlog', label: 'Backlog', accent: 'bg-slate-400' },
  { key: 'todo', label: 'To Do', accent: 'bg-sky-500' },
  { key: 'in-progress', label: 'In Progress', accent: 'bg-amber-500' },
  { key: 'review', label: 'Review', accent: 'bg-indigo-500' },
  { key: 'completed', label: 'Completed', accent: 'bg-emerald-500' },
];

interface Props {
  projectId: string;
  tasks: Task[];
  members: User[];
  onChanged: () => void;
  onOpenTask: (task: Task) => void;
}

export default function TaskBoard({ projectId, tasks, members, onChanged, onOpenTask }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const memberOf = (id: string | null) => members.find((m) => m.id === id);

  const moveTask = async (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    await api.patch(`/projects/${projectId}/tasks/${taskId}/move`, { status }).catch(() => undefined);
    onChanged();
  };

  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            className={`flex w-72 flex-shrink-0 snap-start flex-col rounded-xl border bg-slate-100/60 transition lg:w-auto ${
              overColumn === col.key ? 'border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-100' : 'border-slate-200'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.key);
            }}
            onDragLeave={() => setOverColumn((c) => (c === col.key ? null : c))}
            onDrop={() => {
              setOverColumn(null);
              if (dragging) moveTask(dragging, col.key);
              setDragging(null);
            }}
          >
            <div className="flex items-center gap-2 px-3.5 pt-3.5">
              <span className={`h-2 w-2 rounded-full ${col.accent}`} />
              <h3 className="text-[13px] font-bold text-navy-900">{col.label}</h3>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">{colTasks.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-3">
              {colTasks.map((task) => {
                const assignee = memberOf(task.assigneeId);
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => onOpenTask(task)}
                    className={`card cursor-pointer p-3.5 transition hover:border-indigo-300 hover:shadow-pop active:cursor-grabbing ${dragging === task.id ? 'rotate-1 opacity-60' : ''}`}
                  >
                    <p className={`text-[13.5px] font-semibold leading-snug text-navy-900 ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'amber' : 'slate'}>{task.priority}</Badge>
                      {task.deadline && (
                        <span className={`text-[11px] font-medium ${isOverdue(task.deadline) && task.status !== 'completed' ? 'text-rose-600' : 'text-slate-400'}`}>
                          {isOverdue(task.deadline) && task.status !== 'completed' ? 'Overdue · ' : 'Due '}
                          {formatDate(task.deadline, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {task.commentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CommentIcon size={11} /> {task.commentCount}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {assignee ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />
                          <span className="text-[11px] font-medium text-slate-500">{assignee.name.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300">Unassigned</span>
                      )}
                      <StatusBadge status={task.status} />
                    </div>
                  </article>
                );
              })}
              {colTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">Drop tasks here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Task modal -------------------------------- */

export function TaskModal({
  open,
  onClose,
  projectId,
  task,
  members,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task: Task | null;
  members: User[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '' as string,
    priority: 'medium' as Task['priority'],
    status: 'todo' as TaskStatus,
    deadline: '',
  });
  const [initialized, setInitialized] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const signature = task ? `${task.id}:${task.updatedAt}` : 'new';
  if (open && initialized !== signature) {
    setInitialized(signature);
    setForm({
      title: task?.title ?? '',
      description: task?.description ?? '',
      assigneeId: task?.assigneeId ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'todo',
      deadline: task?.deadline ? task.deadline.slice(0, 10) : '',
    });
  }

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description,
      assigneeId: form.assigneeId || null,
      priority: form.priority,
      status: form.status,
      deadline: form.deadline ? new Date(`${form.deadline}T12:00:00Z`).toISOString() : null,
    };
    if (task) await api.patch(`/projects/${projectId}/tasks/${task.id}`, payload).catch(() => undefined);
    else await api.post(`/projects/${projectId}/tasks`, payload).catch(() => undefined);
    setSaving(false);
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!task) return;
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await api.delete(`/projects/${projectId}/tasks/${task.id}`).catch(() => undefined);
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'}>
      <div className="space-y-3.5">
        <div>
          <label className="label" htmlFor="task-title">Title</label>
          <input id="task-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Implement Authentication" />
        </div>
        <div>
          <label className="label" htmlFor="task-desc">Description</label>
          <textarea id="task-desc" className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-assignee">Assignee</label>
            <select id="task-assignee" className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-priority">Priority</label>
            <select id="task-priority" className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-status">Status</label>
            <select id="task-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
              {COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-deadline">Deadline</label>
            <input id="task-deadline" type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button className="btn-primary flex-1" onClick={save} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
          </button>
          {task && (
            <button className="btn-secondary text-rose-600 hover:bg-rose-50" onClick={remove}>
              Delete
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export { COLUMNS };
export const NewTaskButton = ({ onClick }: { onClick: () => void }) => (
  <button className="btn-primary" onClick={onClick}>
    <PlusIcon size={15} /> New Task
  </button>
);
