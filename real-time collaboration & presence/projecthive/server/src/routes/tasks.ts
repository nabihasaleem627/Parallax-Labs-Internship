import { Router } from 'express';
import { store } from '../db/store.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/access.js';
import { createTaskSchema, moveTaskSchema, updateTaskSchema } from '../validation/schemas.js';
import { parseBody, prm } from '../utils/http.js';
import { notify, userName } from '../utils/activity.js';
import { broadcastComment, logActivity } from '../sockets/index.js';
import type { Comment, Task } from '../types.js';

export const tasksRouter = Router({ mergeParams: true });
tasksRouter.use(requireAuth, requireProjectAccess);

const projectTasks = (projectId: string) => store.filter('tasks', (t: Task) => t.projectId === projectId);

tasksRouter.get('/', (req, res) => {
  res.json({ tasks: projectTasks(prm(req, 'projectId')) });
});

tasksRouter.post('/', (req: AuthedRequest, res) => {
  const input = parseBody(createTaskSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const now = new Date().toISOString();
  const task = store.insert('tasks', {
    projectId,
    ...input,
    commentCount: 0,
    createdBy: req.user!.id,
    createdAt: now,
    updatedAt: now,
  } as Omit<Task, 'id'>) as Task;
  logActivity(projectId, req.user!.id, 'task.create', `${userName(req.user!.id)} created task "${task.title}"`);
  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    notify(task.assigneeId, 'task', 'You were assigned a new task', task.title, projectId);
  }
  res.status(201).json({ task });
});

tasksRouter.patch('/:taskId', (req: AuthedRequest, res) => {
  const input = parseBody(updateTaskSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const task = store.find('tasks', (t: Task) => t.id === prm(req, 'taskId') && t.projectId === projectId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const updated = store.update('tasks', task.id, { ...input, updatedAt: new Date().toISOString() }) as Task;
  logActivity(projectId, req.user!.id, 'task.update', `${userName(req.user!.id)} updated task "${updated.title}"`);
  res.json({ task: updated });
});

tasksRouter.patch('/:taskId/move', (req: AuthedRequest, res) => {
  const input = parseBody(moveTaskSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const task = store.find('tasks', (t: Task) => t.id === prm(req, 'taskId') && t.projectId === projectId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const updated = store.update('tasks', task.id, { status: input.status, updatedAt: new Date().toISOString() }) as Task;
  logActivity(projectId, req.user!.id, 'task.update', `${userName(req.user!.id)} moved "${updated.title}" to ${input.status}`);
  res.json({ task: updated });
});

tasksRouter.delete('/:taskId', (req: AuthedRequest, res) => {
  const projectId = prm(req, 'projectId');
  const task = store.find('tasks', (t: Task) => t.id === prm(req, 'taskId') && t.projectId === projectId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  store.remove('tasks', task.id);
  logActivity(projectId, req.user!.id, 'task.delete', `${userName(req.user!.id)} deleted task "${task.title}"`);
  res.json({ message: 'Task deleted' });
});

// Comments on a task
tasksRouter.get('/:taskId/comments', (req, res) => {
  const comments = store.filter('comments', (c: Comment) => c.targetType === 'task' && c.targetId === prm(req, 'taskId'));
  res.json({ comments });
});

tasksRouter.post('/:taskId/comments', (req: AuthedRequest, res) => {
  const body = String(req.body?.body ?? '').trim();
  if (!body) {
    res.status(400).json({ error: 'Comment body is required' });
    return;
  }
  const projectId = prm(req, 'projectId');
  const task = store.find('tasks', (t: Task) => t.id === prm(req, 'taskId') && t.projectId === projectId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const comment = store.insert('comments', {
    projectId,
    targetType: 'task',
    targetId: task.id,
    authorId: req.user!.id,
    body,
    parentId: req.body?.parentId ?? null,
    resolved: false,
    createdAt: new Date().toISOString(),
  } as Omit<Comment, 'id'>) as Comment;
  store.update('tasks', task.id, { commentCount: task.commentCount + 1 });
  logActivity(projectId, req.user!.id, 'comment.create', `${userName(req.user!.id)} commented on "${task.title}"`);
  broadcastComment(projectId, {
    id: comment.id,
    authorId: comment.authorId,
    authorName: userName(comment.authorId),
    avatarColor: store.find('users', (u) => u.id === comment.authorId)?.avatarColor ?? '#64748b',
    targetType: comment.targetType,
    targetId: comment.targetId,
    body: comment.body,
    parentId: comment.parentId,
    resolved: false,
    createdAt: comment.createdAt,
  });
  if (task.assigneeId && task.assigneeId !== req.user!.id) {
    notify(task.assigneeId, 'comment', `${userName(req.user!.id)} commented on "${task.title}"`, body, projectId);
  }
  res.status(201).json({ comment });
});
