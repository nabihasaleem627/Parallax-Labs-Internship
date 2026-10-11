import type { Server, Socket } from 'socket.io';
import { store } from '../db/store.js';
import { verifyToken } from '../middleware/auth.js';
import { isProjectMember } from '../middleware/access.js';
import { recordActivity, userName } from '../utils/activity.js';
import type { Activity, CollaborativeDocument, ProjectMember, User } from '../types.js';
import {
  SOCKET_EVENTS,
  type ActivityNewEvent,
  type CommentNewEvent,
  type DocumentConflictEvent,
  type DocumentUpdatePayload,
  type DocumentUpdatedEvent,
  type PresenceMemberEvent,
  type PresenceUpdateEvent,
  type SyncRequestPayload,
  type SyncResponseEvent,
  type TypingPayload,
} from './events.js';

export const roomOf = (projectId: string) => `project:${projectId}`;

interface PresenceEntry {
  socketIds: Set<string>;
  connectedAt: string;
  activity: string;
}

/** projectId → userId → live presence entry */
const presence = new Map<string, Map<string, PresenceEntry>>();
const typingTimers = new Map<string, NodeJS.Timeout>();

let ioRef: Server | null = null;
export function getIO(): Server | null {
  return ioRef;
}

function getUser(userId: string): User | undefined {
  return store.find('users', (u: User) => u.id === userId);
}

function buildPresenceList(projectId: string): PresenceMemberEvent[] {
  const entries = presence.get(projectId) ?? new Map<string, PresenceEntry>();
  const members = store.filter('projectMembers', (m: ProjectMember) => m.projectId === projectId);
  const list: (PresenceMemberEvent | null)[] = members.map((m) => {
    const user = getUser(m.userId);
    if (!user) return null;
    const entry = entries.get(m.userId);
    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      department: user.department,
      avatarColor: user.avatarColor,
      activity: entry?.activity ?? 'Offline',
      online: Boolean(entry),
      connectedAt: entry?.connectedAt ?? '',
    };
  });
  return list
    .filter((x): x is PresenceMemberEvent => x !== null)
    .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
}

export function broadcastPresence(projectId: string): void {
  ioRef?.to(roomOf(projectId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
    projectId,
    members: buildPresenceList(projectId),
  } satisfies PresenceUpdateEvent);
}

export function broadcastActivity(projectId: string, activity: Activity): void {
  const user = getUser(activity.userId);
  ioRef?.to(roomOf(projectId)).emit(SOCKET_EVENTS.ACTIVITY_NEW, {
    projectId,
    activity: {
      id: activity.id,
      userId: activity.userId,
      userName: user?.name ?? 'Unknown',
      avatarColor: user?.avatarColor ?? '#64748b',
      type: activity.type,
      message: activity.message,
      createdAt: activity.createdAt,
    },
  } satisfies ActivityNewEvent);
}

export function broadcastComment(projectId: string, comment: CommentNewEvent['comment']): void {
  ioRef?.to(roomOf(projectId)).emit(SOCKET_EVENTS.COMMENT_NEW, { projectId, comment } satisfies CommentNewEvent);
}

export function logActivity(projectId: string, userId: string, type: Activity['type'], message: string): void {
  const activity = recordActivity(projectId, userId, type, message);
  broadcastActivity(projectId, activity);
}

function setPresenceActivity(projectId: string, userId: string, activity: string): void {
  const entry = presence.get(projectId)?.get(userId);
  if (entry && entry.activity !== activity) {
    entry.activity = activity;
    broadcastPresence(projectId);
  }
}

function snapshotVersion(doc: CollaborativeDocument, savedBy: string): void {
  store.insert('documentVersions', {
    documentId: doc.id,
    version: doc.version,
    content: doc.content,
    savedBy,
    createdAt: doc.updatedAt,
  });
}

export function setupSockets(io: Server): void {
  ioRef = io;

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    const payload = token ? verifyToken(token) : null;
    const user = payload ? getUser(payload.sub) : undefined;
    if (!user) {
      next(new Error('Authentication failed'));
      return;
    }
    socket.data.userId = user.id;
    socket.data.role = user.role;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    socket.on(SOCKET_EVENTS.PROJECT_JOIN, (payload: { projectId: string; reconnected?: boolean }) => {
      const { projectId, reconnected } = payload ?? {};
      if (!projectId || !isProjectMember(userId, projectId)) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied to this project room' });
        return;
      }
      const room = roomOf(projectId);
      socket.join(room);
      socket.data.projectId = projectId;

      let entries = presence.get(projectId);
      if (!entries) {
        entries = new Map();
        presence.set(projectId, entries);
      }
      const existing = entries.get(userId);
      const isNew = !existing;
      if (existing) {
        existing.socketIds.add(socket.id);
      } else {
        entries.set(userId, {
          socketIds: new Set([socket.id]),
          connectedAt: new Date().toISOString(),
          activity: 'Viewing project',
        });
      }

      if (reconnected) {
        socket.emit(SOCKET_EVENTS.CONNECTION_RECONNECTED, { projectId, serverTime: new Date().toISOString() });
      }
      io.to(room).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        projectId,
        members: buildPresenceList(projectId),
      } satisfies PresenceUpdateEvent);
      if (isNew) {
        logActivity(projectId, userId, 'presence.join', `${userName(userId)} joined the project`);
      }
      socket.emit(SOCKET_EVENTS.SYNC_RESPONSE, buildSyncResponse(projectId));
    });

    socket.on(SOCKET_EVENTS.PROJECT_LEAVE, (payload: { projectId: string }) => {
      leaveProject(socket, payload?.projectId);
    });

    socket.on(SOCKET_EVENTS.DOCUMENT_TYPING_START, (payload: TypingPayload) => {
      const { projectId, documentId } = payload ?? {};
      if (!projectId || !documentId || !isProjectMember(userId, projectId)) return;
      const doc = store.find('collaborativeDocuments', (d: CollaborativeDocument) => d.id === documentId);
      setPresenceActivity(projectId, userId, `Typing in ${doc?.title ?? 'document'}`);
      socket.to(roomOf(projectId)).emit(SOCKET_EVENTS.DOCUMENT_TYPING_START, { projectId, documentId, userId, userName: userName(userId) });
      const timerKey = `${socket.id}:${documentId}`;
      clearTimeout(typingTimers.get(timerKey));
      typingTimers.set(
        timerKey,
        setTimeout(() => {
          typingTimers.delete(timerKey);
          socket.to(roomOf(projectId)).emit(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, { projectId, documentId, userId, userName: userName(userId) });
          setPresenceActivity(projectId, userId, 'Viewing project');
        }, 6000),
      );
    });

    socket.on(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, (payload: TypingPayload) => {
      const { projectId, documentId } = payload ?? {};
      if (!projectId || !documentId) return;
      const timerKey = `${socket.id}:${documentId}`;
      clearTimeout(typingTimers.get(timerKey));
      typingTimers.delete(timerKey);
      socket.to(roomOf(projectId)).emit(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, { projectId, documentId, userId, userName: userName(userId) });
      setPresenceActivity(projectId, userId, 'Viewing project');
    });

    socket.on(SOCKET_EVENTS.DOCUMENT_UPDATE, (payload: DocumentUpdatePayload) => {
      const { projectId, documentId, content, baseVersion } = payload ?? {};
      if (!projectId || !documentId || !isProjectMember(userId, projectId)) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied to this document' });
        return;
      }
      const doc = store.find('collaborativeDocuments', (d: CollaborativeDocument) => d.id === documentId);
      if (!doc || doc.projectId !== projectId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Document not found' });
        return;
      }

      // Optimistic concurrency control: reject stale writes, never overwrite silently.
      if (baseVersion !== doc.version) {
        socket.emit(SOCKET_EVENTS.DOCUMENT_CONFLICT, {
          projectId,
          documentId,
          yourVersion: baseVersion,
          serverVersion: doc.version,
          serverContent: doc.content,
          serverUpdatedBy: doc.updatedBy ?? '',
          serverUpdatedByName: userName(doc.updatedBy),
          serverUpdatedAt: doc.updatedAt,
        } satisfies DocumentConflictEvent);
        logActivity(projectId, userId, 'document.conflict', `Conflict detected while ${userName(userId)} edited ${doc.title}`);
        return;
      }

      const previous = { ...doc };
      doc.content = content;
      doc.version += 1;
      doc.updatedBy = userId;
      doc.updatedAt = new Date().toISOString();
      snapshotVersion(previous, userId);
      store.flush();

      const event: DocumentUpdatedEvent = {
        projectId,
        documentId,
        content,
        version: doc.version,
        updatedBy: userId,
        updatedByName: userName(userId),
        updatedAt: doc.updatedAt,
      };
      socket.emit(SOCKET_EVENTS.DOCUMENT_SAVE_ACK, { documentId, version: doc.version, savedAt: doc.updatedAt });
      socket.to(roomOf(projectId)).emit(SOCKET_EVENTS.DOCUMENT_UPDATED, event);
      logActivity(projectId, userId, 'document.update', `${userName(userId)} updated ${doc.title}`);
    });

    socket.on(SOCKET_EVENTS.SYNC_REQUEST, (payload: SyncRequestPayload) => {
      const { projectId } = payload ?? {};
      if (!projectId || !isProjectMember(userId, projectId)) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied to this project' });
        return;
      }
      socket.emit(SOCKET_EVENTS.SYNC_RESPONSE, buildSyncResponse(projectId, payload.documentId));
    });

    socket.on('disconnect', () => {
      const projectId = socket.data.projectId as string | undefined;
      for (const key of [...typingTimers.keys()]) {
        if (key.startsWith(`${socket.id}:`)) {
          clearTimeout(typingTimers.get(key));
          typingTimers.delete(key);
        }
      }
      if (projectId) leaveProject(socket, projectId, true);
    });
  });
}

function buildSyncResponse(projectId: string, documentId?: string): SyncResponseEvent {
  const docs = store.filter('collaborativeDocuments', (d: CollaborativeDocument) => d.projectId === projectId);
  return {
    projectId,
    documents: docs
      .filter((d) => !documentId || d.id === documentId)
      .map((d) => ({ id: d.id, content: d.content, version: d.version, updatedAt: d.updatedAt, updatedBy: d.updatedBy })),
    presence: buildPresenceList(projectId),
    serverTime: new Date().toISOString(),
  };
}

function leaveProject(socket: Socket, projectId: string | undefined, fromDisconnect = false): void {
  if (!projectId) return;
  socket.leave(roomOf(projectId));
  if (!fromDisconnect) socket.data.projectId = undefined;
  const entries = presence.get(projectId);
  const entry = entries?.get(socket.data.userId as string);
  if (entries && entry) {
    entry.socketIds.delete(socket.id);
    if (entry.socketIds.size === 0) {
      entries.delete(socket.data.userId as string);
      ioRef?.to(roomOf(projectId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        projectId,
        members: buildPresenceList(projectId),
      } satisfies PresenceUpdateEvent);
      logActivity(projectId, socket.data.userId as string, 'presence.leave', `${userName(socket.data.userId as string)} left the project`);
    }
  }
}
