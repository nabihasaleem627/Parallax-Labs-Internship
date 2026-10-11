import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useWorkspace } from './WorkspaceLayout';
import TaskBoard, { NewTaskButton, TaskModal } from '../../components/TaskBoard';
import CommentsPanel from '../../components/CommentsPanel';
import { Avatar, Badge, Modal, PageSkeleton, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';
import type { Task } from '../../types';

export default function TasksPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project } = useWorkspace();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);

  const load = useCallback(() => {
    api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`).then(({ tasks }) => setTasks(tasks)).catch(() => setTasks([]));
  }, [projectId]);

  useEffect(load, [load]);

  if (!tasks || !project) return <PageSkeleton rows={2} />;
  const members = project.members ?? [];
  const detailTask = detail ? tasks.find((t) => t.id === detail.id) ?? detail : null;
  const assignee = detailTask ? members.find((m) => m.id === detailTask.assigneeId) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-900">Task Board</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {tasks.filter((t) => t.status !== 'completed').length} open · {tasks.filter((t) => t.status === 'completed').length} completed — drag cards between columns
          </p>
        </div>
        <NewTaskButton
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        />
      </div>

      <TaskBoard
        projectId={projectId}
        tasks={tasks}
        members={members}
        onChanged={load}
        onOpenTask={(task) => setDetail(task)}
      />

      <TaskModal open={editorOpen} onClose={() => setEditorOpen(false)} projectId={projectId} task={editing} members={members} onSaved={load} />

      {/* Task detail */}
      <Modal open={Boolean(detailTask)} onClose={() => setDetail(null)} title={detailTask?.title ?? ''} wide>
        {detailTask && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detailTask.status} />
              <Badge tone={detailTask.priority === 'high' ? 'red' : detailTask.priority === 'medium' ? 'amber' : 'slate'}>{detailTask.priority} priority</Badge>
              {detailTask.deadline && <Badge tone="slate">Due {formatDate(detailTask.deadline)}</Badge>}
            </div>
            {detailTask.description && <p className="rounded-lg bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-100">{detailTask.description}</p>}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned to</span>
              {assignee ? (
                <span className="flex items-center gap-2">
                  <Avatar name={assignee.name} color={assignee.avatarColor} size="xs" />
                  <span className="text-sm font-semibold text-navy-900">{assignee.name}</span>
                </span>
              ) : (
                <span className="text-sm text-slate-400">Unassigned</span>
              )}
              <button
                className="btn-secondary ml-auto !px-3 !py-1.5 text-xs"
                onClick={() => {
                  setEditing(detailTask);
                  setDetail(null);
                  setEditorOpen(true);
                }}
              >
                Edit task
              </button>
            </div>
            <CommentsPanel projectId={projectId} targetType="task" targetId={detailTask.id} title="Task comments" compact />
          </div>
        )}
      </Modal>
    </div>
  );
}
