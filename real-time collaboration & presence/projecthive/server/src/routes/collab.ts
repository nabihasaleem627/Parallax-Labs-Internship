import { Router } from 'express';
import { store } from '../db/store.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/access.js';
import { createCommentSchema, createMeetingSchema, renameFileSchema, uploadFileSchema } from '../validation/schemas.js';
import { parseBody, prm } from '../utils/http.js';
import { notifyProjectMembers, userName } from '../utils/activity.js';
import { broadcastComment, logActivity } from '../sockets/index.js';
import type { Comment, Meeting, ProjectFile } from '../types.js';

/* ---------------------------------- Comments ---------------------------------- */

export const commentsRouter = Router({ mergeParams: true });
commentsRouter.use(requireAuth, requireProjectAccess);

commentsRouter.get('/', (req, res) => {
  const { targetType, targetId } = req.query;
  const comments = store.filter('comments', (c: Comment) => {
    if (c.projectId !== prm(req, 'projectId')) return false;
    if (targetType && c.targetType !== targetType) return false;
    if (targetId && c.targetId !== targetId) return false;
    return true;
  });
  res.json({ comments });
});

commentsRouter.post('/', (req: AuthedRequest, res) => {
  const input = parseBody(createCommentSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const comment = store.insert('comments', {
    projectId,
    ...input,
    authorId: req.user!.id,
    resolved: false,
    createdAt: new Date().toISOString(),
  } as Omit<Comment, 'id'>) as Comment;
  logActivity(projectId, req.user!.id, 'comment.create', `${userName(req.user!.id)} commented on ${comment.targetType}`);
  notifyProjectMembers(projectId, req.user!.id, 'comment', `${userName(req.user!.id)} commented`, comment.body.slice(0, 120));
  broadcastComment(projectId, {
    id: comment.id,
    authorId: comment.authorId,
    authorName: userName(comment.authorId),
    avatarColor: req.user!.avatarColor,
    targetType: comment.targetType,
    targetId: comment.targetId,
    body: comment.body,
    parentId: comment.parentId,
    resolved: false,
    createdAt: comment.createdAt,
  });
  res.status(201).json({ comment });
});

commentsRouter.patch('/:commentId/resolve', (req: AuthedRequest, res) => {
  const comment = store.find('comments', (c: Comment) => c.id === prm(req, 'commentId') && c.projectId === prm(req, 'projectId'));
  if (!comment) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  comment.resolved = !comment.resolved;
  store.flush();
  logActivity(prm(req, 'projectId'), req.user!.id, 'comment.resolve', `${userName(req.user!.id)} ${comment.resolved ? 'resolved' : 'reopened'} a comment`);
  res.json({ comment });
});

commentsRouter.delete('/:commentId', (req: AuthedRequest, res) => {
  const comment = store.find('comments', (c: Comment) => c.id === prm(req, 'commentId') && c.projectId === prm(req, 'projectId'));
  if (!comment) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }
  if (comment.authorId !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'You can only delete your own comments' });
    return;
  }
  store.remove('comments', comment.id);
  res.json({ message: 'Comment deleted' });
});

/* ---------------------------------- Meetings ---------------------------------- */

export const meetingsRouter = Router({ mergeParams: true });
meetingsRouter.use(requireAuth, requireProjectAccess);

meetingsRouter.get('/', (req, res) => {
  const meetings = store
    .filter('meetings', (m: Meeting) => m.projectId === prm(req, 'projectId'))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  res.json({ meetings });
});

meetingsRouter.post('/', (req: AuthedRequest, res) => {
  const input = parseBody(createMeetingSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const meeting = store.insert('meetings', {
    projectId,
    ...input,
    supervisorId: req.user!.role === 'supervisor' ? req.user!.id : store.find('projects', (p) => p.id === projectId)?.supervisorId ?? null,
    notesDocumentId: null,
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  } as Omit<Meeting, 'id'>) as Meeting;
  logActivity(projectId, req.user!.id, 'meeting.create', `${userName(req.user!.id)} scheduled "${meeting.title}"`);
  notifyProjectMembers(projectId, req.user!.id, 'meeting', `New meeting: ${meeting.title}`, new Date(meeting.scheduledAt).toUTCString());
  res.status(201).json({ meeting });
});

meetingsRouter.post('/:meetingId/notes', (req: AuthedRequest, res) => {
  const meeting = store.find('meetings', (m: Meeting) => m.id === prm(req, 'meetingId') && m.projectId === prm(req, 'projectId'));
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }
  if (!meeting.notesDocumentId) {
    const now = new Date().toISOString();
    const doc = store.insert('collaborativeDocuments', {
      projectId: meeting.projectId,
      title: `${meeting.title} — Notes`,
      kind: 'meeting',
      content: `<h2>${meeting.title}</h2><p>${new Date(meeting.scheduledAt).toUTCString()}</p><ul><li>${meeting.agenda.join('</li><li>') || 'Notes'}</li></ul>`,
      version: 1,
      updatedBy: req.user!.id,
      createdAt: now,
      updatedAt: now,
    });
    meeting.notesDocumentId = (doc as { id: string }).id;
    store.flush();
  }
  res.json({ meeting });
});

meetingsRouter.patch('/:meetingId', (req: AuthedRequest, res) => {
  const meeting = store.find('meetings', (m: Meeting) => m.id === prm(req, 'meetingId') && m.projectId === prm(req, 'projectId'));
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }
  const status = req.body?.status;
  if (status && ['upcoming', 'completed'].includes(status)) meeting.status = status;
  store.flush();
  res.json({ meeting });
});

meetingsRouter.delete('/:meetingId', (req: AuthedRequest, res) => {
  const meeting = store.find('meetings', (m: Meeting) => m.id === prm(req, 'meetingId') && m.projectId === prm(req, 'projectId'));
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }
  store.remove('meetings', meeting.id);
  res.json({ message: 'Meeting deleted' });
});

/* ------------------------------ Document library ------------------------------ */

export const filesRouter = Router({ mergeParams: true });
filesRouter.use(requireAuth, requireProjectAccess);

filesRouter.get('/', (req, res) => {
  const files = store
    .filter('files', (f: ProjectFile) => f.projectId === prm(req, 'projectId'))
    .map((f) => ({ ...f, uploadedByName: userName(f.uploadedById) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ files });
});

filesRouter.post('/', (req: AuthedRequest, res) => {
  const input = parseBody(uploadFileSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const now = new Date().toISOString();
  const buffer = Buffer.from(input.contentBase64, 'base64');
  const file = store.insert('files', {
    projectId,
    name: input.name,
    type: input.type,
    sizeBytes: buffer.byteLength,
    version: 1,
    uploadedById: req.user!.id,
    storageKey: `${projectId}/${Date.now()}-${input.name}`,
    contentBase64: input.contentBase64,
    createdAt: now,
    updatedAt: now,
  } as Omit<ProjectFile, 'id'>) as ProjectFile;
  logActivity(projectId, req.user!.id, 'file.upload', `${userName(req.user!.id)} uploaded ${file.name}`);
  res.status(201).json({ file: { ...file, uploadedByName: userName(file.uploadedById) } });
});

filesRouter.get('/:fileId/download', (req, res) => {
  const file = store.find('files', (f: ProjectFile) => f.id === prm(req, 'fileId') && f.projectId === prm(req, 'projectId')) as
    | (ProjectFile & { contentBase64?: string })
    | undefined;
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  const content = file.contentBase64
    ? Buffer.from(file.contentBase64, 'base64')
    : Buffer.from(`ProjectHive sample file: ${file.name}\nUploaded by ${userName(file.uploadedById)} on ${file.createdAt}.\n`, 'utf8');
  res.setHeader('Content-Type', file.type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '')}"`);
  res.send(content);
});

filesRouter.patch('/:fileId', (req: AuthedRequest, res) => {
  const input = parseBody(renameFileSchema, req, res);
  if (!input) return;
  const file = store.find('files', (f: ProjectFile) => f.id === prm(req, 'fileId') && f.projectId === prm(req, 'projectId'));
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  file.name = input.name;
  file.version += 1;
  file.updatedAt = new Date().toISOString();
  store.flush();
  res.json({ file: { ...file, uploadedByName: userName(file.uploadedById) } });
});

filesRouter.delete('/:fileId', (req: AuthedRequest, res) => {
  const projectId = prm(req, 'projectId');
  const file = store.find('files', (f: ProjectFile) => f.id === prm(req, 'fileId') && f.projectId === projectId);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  if (file.uploadedById !== req.user!.id && req.user!.role !== 'admin' && req.user!.id !== store.find('projects', (p) => p.id === projectId)?.supervisorId) {
    res.status(403).json({ error: 'Not allowed to delete this file' });
    return;
  }
  store.remove('files', file.id);
  logActivity(projectId, req.user!.id, 'file.delete', `${userName(req.user!.id)} deleted ${file.name}`);
  res.json({ message: 'File deleted' });
});

/* ---------------------------------- Activity ---------------------------------- */

export const activityRouter = Router({ mergeParams: true });
activityRouter.use(requireAuth, requireProjectAccess);

activityRouter.get('/', (req, res) => {
  const activities = store
    .filter('activities', (a) => a.projectId === prm(req, 'projectId'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100)
    .map((a) => {
      const user = store.find('users', (u) => u.id === a.userId);
      return { ...a, userName: user?.name ?? 'Unknown', avatarColor: user?.avatarColor ?? '#64748b' };
    });
  res.json({ activities });
});

/* -------------------------------- Notifications ------------------------------- */

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', (req: AuthedRequest, res) => {
  const notifications = store
    .filter('notifications', (n) => n.userId === req.user!.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
  res.json({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
});

notificationsRouter.post('/:notificationId/read', (req: AuthedRequest, res) => {
  const notification = store.find('notifications', (n) => n.id === prm(req, 'notificationId') && n.userId === req.user!.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  notification.read = true;
  store.flush();
  res.json({ notification });
});

notificationsRouter.post('/read-all', (req: AuthedRequest, res) => {
  for (const n of store.filter('notifications', (n) => n.userId === req.user!.id && !n.read)) n.read = true;
  store.flush();
  res.json({ message: 'All notifications marked as read' });
});
