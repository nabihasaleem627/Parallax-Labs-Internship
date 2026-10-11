/**
 * Socket.io event contract — shared by server handlers and the React client.
 * Client → Server events carry the payloads defined here; server → client
 * events are emitted to project rooms only after membership validation.
 */
export const SOCKET_EVENTS = {
  // client → server
  PROJECT_JOIN: 'project:join',
  PROJECT_LEAVE: 'project:leave',
  DOCUMENT_TYPING_START: 'document:typing:start',
  DOCUMENT_TYPING_STOP: 'document:typing:stop',
  DOCUMENT_UPDATE: 'document:update',
  SYNC_REQUEST: 'sync:request',
  // server → client
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

export interface PresenceJoinPayload {
  projectId: string;
}

export interface TypingPayload {
  projectId: string;
  documentId: string;
}

export interface DocumentUpdatePayload {
  projectId: string;
  documentId: string;
  content: string;
  baseVersion: number;
}

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

export interface PresenceMemberEvent {
  userId: string;
  name: string;
  role: string;
  department: string;
  avatarColor: string;
  activity: string;
  online: boolean;
  connectedAt: string;
}

export interface PresenceUpdateEvent {
  projectId: string;
  members: PresenceMemberEvent[];
}

export interface SyncRequestPayload {
  projectId: string;
  documentId?: string;
}

export interface SyncResponseEvent {
  projectId: string;
  documents: { id: string; content: string; version: number; updatedAt: string; updatedBy: string | null }[];
  presence: PresenceMemberEvent[];
  serverTime: string;
}

export interface ActivityNewEvent {
  projectId: string;
  activity: {
    id: string;
    userId: string;
    userName: string;
    avatarColor: string;
    type: string;
    message: string;
    createdAt: string;
  };
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
