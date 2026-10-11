/**
 * Socket.io event contract — mirrors server/src/sockets/events.ts exactly.
 * Keep both files in sync when changing the real-time protocol.
 */
export const SOCKET_EVENTS = {
  PROJECT_JOIN: 'project:join',
  PROJECT_LEAVE: 'project:leave',
  DOCUMENT_TYPING_START: 'document:typing:start',
  DOCUMENT_TYPING_STOP: 'document:typing:stop',
  DOCUMENT_UPDATE: 'document:update',
  SYNC_REQUEST: 'sync:request',
  PRESENCE_UPDATE: 'presence:update',
  DOCUMENT_UPDATED: 'document:updated',
  DOCUMENT_CONFLICT: 'document:conflict',
  DOCUMENT_SAVE_ACK: 'document:save:ack',
  SYNC_RESPONSE: 'sync:response',
  ACTIVITY_NEW: 'activity:new',
  COMMENT_NEW: 'comment:new',
  CONNECTION_RECONNECTED: 'connection:reconnected',
  ERROR: 'socket:error',
} as const;

export interface DocumentUpdatedEvent {
  projectId: string;
  documentId: string;
  content: string;
  version: number;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface DocumentConflictEvent {
  projectId: string;
  documentId: string;
  yourVersion: number;
  serverVersion: number;
  serverContent: string;
  serverUpdatedBy: string;
  serverUpdatedByName: string;
  serverUpdatedAt: string;
}

export interface PresenceUpdateEvent {
  projectId: string;
  members: import('../types').PresenceMember[];
}

export interface SyncResponseEvent {
  projectId: string;
  documents: { id: string; content: string; version: number; updatedAt: string; updatedBy: string | null }[];
  presence: import('../types').PresenceMember[];
  serverTime: string;
}

export interface ActivityNewEvent {
  projectId: string;
  activity: import('../types').ActivityItem;
}

export interface CommentNewEvent {
  projectId: string;
  comment: {
    id: string;
    authorId: string;
    authorName: string;
    avatarColor: string;
    targetType: string;
    targetId: string;
    body: string;
    parentId: string | null;
    resolved: boolean;
    createdAt: string;
  };
}

export interface TypingEvent {
  projectId: string;
  documentId: string;
  userId: string;
  userName: string;
}
