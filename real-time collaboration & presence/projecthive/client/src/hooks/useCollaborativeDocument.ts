import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { connectSocket } from '../realtime/socket';
import {
  SOCKET_EVENTS,
  type DocumentConflictEvent,
  type DocumentUpdatedEvent,
  type SyncResponseEvent,
  type TypingEvent,
} from '../realtime/events';
import type { CollaborativeDocument, ConflictInfo, SaveStatus } from '../types';

const draftKey = (documentId: string) => `projecthive.draft.${documentId}`;
const SAVE_DEBOUNCE_MS = 700;
const TYPING_IDLE_MS = 2500;

interface Draft {
  content: string;
  baseVersion: number;
  savedAt: string;
}

function readDraft(documentId: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(documentId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(documentId: string, draft: Draft | null): void {
  if (draft) localStorage.setItem(draftKey(documentId), JSON.stringify(draft));
  else localStorage.removeItem(draftKey(documentId));
}

/**
 * Collaborative document engine.
 *
 * - Loads the document over REST, then keeps it in sync over Socket.io.
 * - Local edits are debounced and submitted as (content, baseVersion) pairs.
 * - The server accepts the write only when baseVersion matches its version
 *   (optimistic concurrency control) and broadcasts document:updated.
 * - Stale writes come back as document:conflict and are surfaced to the user
 *   instead of silently overwriting remote work.
 * - Offline edits are queued in localStorage and flushed after reconnection,
 *   re-validating the server version first via sync:request.
 */
export function useCollaborativeDocument(projectId: string | undefined, documentId: string | undefined) {
  const [doc, setDoc] = useState<CollaborativeDocument | null>(null);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const versionRef = useRef(0);
  const contentRef = useRef('');
  const dirtyRef = useRef(false);
  const localEditRef = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const typingTimer = useRef<number | null>(null);
  const typingActiveRef = useRef(false);
  const focusedRef = useRef(false);

  const setEditorContent = useCallback((html: string, version: number) => {
    localEditRef.current = true;
    contentRef.current = html;
    versionRef.current = version;
    setContent(html);
    requestAnimationFrame(() => {
      localEditRef.current = false;
    });
  }, []);

  const attemptSave = useCallback(() => {
    if (!projectId || !documentId || !dirtyRef.current) return;
    const socket = connectSocket();
    if (!socket.connected) {
      setSaveStatus('offline');
      writeDraft(documentId, { content: contentRef.current, baseVersion: versionRef.current, savedAt: new Date().toISOString() });
      return;
    }
    setSaveStatus('saving');
    socket.emit(SOCKET_EVENTS.DOCUMENT_UPDATE, {
      projectId,
      documentId,
      content: contentRef.current,
      baseVersion: versionRef.current,
    });
  }, [projectId, documentId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(attemptSave, SAVE_DEBOUNCE_MS);
  }, [attemptSave]);

  /** Called by the editor on every local input event. */
  const onLocalChange = useCallback(
    (html: string) => {
      contentRef.current = html;
      dirtyRef.current = true;
      const socket = connectSocket();
      setSaveStatus(socket.connected ? 'saving' : 'offline');
      if (socket.connected && documentId && projectId) {
        if (!typingActiveRef.current) {
          typingActiveRef.current = true;
          socket.emit(SOCKET_EVENTS.DOCUMENT_TYPING_START, { projectId, documentId });
        }
        if (typingTimer.current) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => {
          typingActiveRef.current = false;
          socket.emit(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, { projectId, documentId });
        }, TYPING_IDLE_MS);
      }
      scheduleSave();
    },
    [documentId, projectId, scheduleSave],
  );

  const onFocusChange = useCallback(
    (focused: boolean) => {
      focusedRef.current = focused;
      if (!focused && typingActiveRef.current) {
        typingActiveRef.current = false;
        const socket = connectSocket();
        if (projectId && documentId) socket.emit(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, { projectId, documentId });
      }
    },
    [documentId, projectId],
  );

  // Initial load (REST) + pending draft recovery
  useEffect(() => {
    if (!projectId || !documentId) return;
    let cancelled = false;
    setSaveStatus('loading');
    setError(null);
    setConflict(null);
    api
      .get<{ document: CollaborativeDocument }>(`/projects/${projectId}/documents/${documentId}`)
      .then(({ document }) => {
        if (cancelled) return;
        setDoc(document);
        setLastSavedAt(document.updatedAt);
        const draft = readDraft(documentId);
        if (draft && draft.content !== document.content) {
          if (draft.baseVersion === document.version) {
            // Our own offline edit — restore it and flush once connected.
            setEditorContent(draft.content, document.version);
            dirtyRef.current = true;
            setSaveStatus('pending');
            const socket = connectSocket();
            if (socket.connected) window.setTimeout(attemptSave, 300);
          } else {
            // Server moved on while we were offline — surface the conflict.
            setEditorContent(draft.content, draft.baseVersion);
            dirtyRef.current = true;
            setConflict({
              documentId,
              yourVersion: draft.baseVersion,
              serverVersion: document.version,
              serverContent: document.content,
              serverUpdatedByName: 'another team member',
              serverUpdatedAt: document.updatedAt,
            });
            setSaveStatus('conflict');
          }
        } else {
          setEditorContent(document.content, document.version);
          dirtyRef.current = false;
          setSaveStatus('saved');
        }
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setSaveStatus('saved');
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, documentId, attemptSave, setEditorContent]);

  // Socket listeners: remote updates, acks, conflicts, sync responses, connection changes
  useEffect(() => {
    if (!projectId || !documentId) return;
    const socket = connectSocket();

    const onRemoteUpdate = (event: DocumentUpdatedEvent) => {
      if (event.documentId !== documentId || event.projectId !== projectId) return;
      // The server broadcasts document:updated to everyone except the sender,
      // so this is always another teammate's change.
      versionRef.current = Math.max(versionRef.current, event.version);
      setDoc((prev) => (prev ? { ...prev, version: event.version, updatedAt: event.updatedAt, updatedBy: event.updatedBy } : prev));
      if (!dirtyRef.current && !focusedRef.current) {
        setEditorContent(event.content, event.version);
        setLastSavedAt(event.updatedAt);
        setSaveStatus('saved');
      }
      // If dirty, we keep the local draft; our next save will be rejected as
      // stale and the server will send document:conflict — no silent overwrite.
    };

    const onAck = (event: { documentId: string; version: number; savedAt: string }) => {
      if (event.documentId !== documentId) return;
      versionRef.current = event.version;
      dirtyRef.current = false;
      writeDraft(documentId, null);
      setDoc((prev) => (prev ? { ...prev, version: event.version, updatedAt: event.savedAt } : prev));
      setLastSavedAt(event.savedAt);
      setSaveStatus('saved');
    };

    const onConflict = (event: DocumentConflictEvent) => {
      if (event.documentId !== documentId) return;
      setConflict({
        documentId,
        yourVersion: event.yourVersion,
        serverVersion: event.serverVersion,
        serverContent: event.serverContent,
        serverUpdatedByName: event.serverUpdatedByName,
        serverUpdatedAt: event.serverUpdatedAt,
      });
      setSaveStatus('conflict');
      if (!socket.connected || dirtyRef.current) {
        writeDraft(documentId, { content: contentRef.current, baseVersion: versionRef.current, savedAt: new Date().toISOString() });
      }
    };

    const onSyncResponse = (event: SyncResponseEvent) => {
      if (event.projectId !== projectId) return;
      const remote = event.documents.find((d) => d.id === documentId);
      if (!remote) return;
      if (remote.version !== versionRef.current) {
        if (dirtyRef.current) {
          // Server advanced while we were offline — conflict, do not overwrite.
          setConflict({
            documentId,
            yourVersion: versionRef.current,
            serverVersion: remote.version,
            serverContent: remote.content,
            serverUpdatedByName: 'another team member',
            serverUpdatedAt: remote.updatedAt,
          });
          setSaveStatus('conflict');
        } else {
          setEditorContent(remote.content, remote.version);
          setLastSavedAt(remote.updatedAt);
          setSaveStatus('saved');
        }
      } else if (dirtyRef.current) {
        // Nobody else touched the doc — flush our queued offline changes.
        setSaveStatus('syncing');
        attemptSave();
      } else {
        setSaveStatus('saved');
      }
    };

    const onDisconnect = () => {
      if (dirtyRef.current) {
        setSaveStatus('offline');
        writeDraft(documentId, { content: contentRef.current, baseVersion: versionRef.current, savedAt: new Date().toISOString() });
      } else {
        setSaveStatus((prev) => (prev === 'conflict' ? prev : 'offline'));
      }
    };

    const onReconnect = () => {
      setSaveStatus((prev) => (prev === 'offline' || prev === 'pending' ? 'syncing' : prev));
      socket.emit(SOCKET_EVENTS.SYNC_REQUEST, { projectId, documentId });
      if (dirtyRef.current && !conflict) {
        writeDraft(documentId, { content: contentRef.current, baseVersion: versionRef.current, savedAt: new Date().toISOString() });
      }
    };

    socket.on(SOCKET_EVENTS.DOCUMENT_UPDATED, onRemoteUpdate);
    socket.on(SOCKET_EVENTS.DOCUMENT_SAVE_ACK, onAck);
    socket.on(SOCKET_EVENTS.DOCUMENT_CONFLICT, onConflict);
    socket.on(SOCKET_EVENTS.SYNC_RESPONSE, onSyncResponse);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onReconnect);
    return () => {
      socket.off(SOCKET_EVENTS.DOCUMENT_UPDATED, onRemoteUpdate);
      socket.off(SOCKET_EVENTS.DOCUMENT_SAVE_ACK, onAck);
      socket.off(SOCKET_EVENTS.DOCUMENT_CONFLICT, onConflict);
      socket.off(SOCKET_EVENTS.SYNC_RESPONSE, onSyncResponse);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onReconnect);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
    };
  }, [projectId, documentId, attemptSave, setEditorContent, conflict]);

  const loadLatestVersion = useCallback(() => {
    if (!conflict) return;
    setEditorContent(conflict.serverContent, conflict.serverVersion);
    dirtyRef.current = false;
    writeDraft(documentId!, null);
    setConflict(null);
    setLastSavedAt(new Date().toISOString());
    setSaveStatus('saved');
  }, [conflict, documentId, setEditorContent]);

  const keepMyDraft = useCallback(() => {
    if (!conflict) return;
    // Rebase the local draft on top of the server version, then save again.
    versionRef.current = conflict.serverVersion;
    setConflict(null);
    dirtyRef.current = true;
    setSaveStatus('saving');
    window.setTimeout(attemptSave, 100);
  }, [attemptSave, conflict]);

  const retrySync = useCallback(() => {
    setSaveStatus('syncing');
    const socket = connectSocket();
    if (!socket.connected) socket.connect();
    socket.emit(SOCKET_EVENTS.SYNC_REQUEST, { projectId, documentId });
  }, [documentId, projectId]);

  return {
    doc,
    content,
    saveStatus,
    lastSavedAt,
    conflict,
    error,
    onLocalChange,
    onFocusChange,
    loadLatestVersion,
    keepMyDraft,
    retrySync,
    isDirty: () => dirtyRef.current,
  };
}

/** Tracks which teammates are currently typing in a given document. */
export function useTypingUsers(projectId: string | undefined, documentId: string | undefined, selfId: string | undefined) {
  const [typing, setTyping] = useState<{ userId: string; name: string }[]>([]);
  const expiry = useRef(new Map<string, number>());

  useEffect(() => {
    if (!projectId || !documentId) return;
    const socket = connectSocket();

    const prune = () => {
      const now = Date.now();
      setTyping((prev) => prev.filter((t) => (expiry.current.get(t.userId) ?? 0) > now));
    };

    const onStart = (event: TypingEvent) => {
      if (event.documentId !== documentId || event.userId === selfId) return;
      expiry.current.set(event.userId, Date.now() + 6500);
      setTyping((prev) => (prev.some((t) => t.userId === event.userId) ? prev : [...prev, { userId: event.userId, name: event.userName }]));
    };

    const onStop = (event: TypingEvent) => {
      if (event.documentId !== documentId || event.userId === selfId) return;
      expiry.current.delete(event.userId);
      setTyping((prev) => prev.filter((t) => t.userId !== event.userId));
    };

    const interval = window.setInterval(prune, 1500);
    socket.on(SOCKET_EVENTS.DOCUMENT_TYPING_START, onStart);
    socket.on(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, onStop);
    return () => {
      window.clearInterval(interval);
      socket.off(SOCKET_EVENTS.DOCUMENT_TYPING_START, onStart);
      socket.off(SOCKET_EVENTS.DOCUMENT_TYPING_STOP, onStop);
      setTyping([]);
    };
  }, [projectId, documentId, selfId]);

  return typing;
}
