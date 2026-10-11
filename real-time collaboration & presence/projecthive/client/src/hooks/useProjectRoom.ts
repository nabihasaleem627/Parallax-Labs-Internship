import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../realtime/socket';
import { SOCKET_EVENTS, type ActivityNewEvent, type PresenceUpdateEvent } from '../realtime/events';
import type { ActivityItem, PresenceMember } from '../types';

export type ConnectionState = 'connecting' | 'online' | 'reconnecting' | 'offline';

export interface ConnectionBanner {
  kind: 'restored' | 'syncing' | 'synced' | 'offline' | null;
  at: number;
}

/**
 * Joins the Socket.io room `project:{projectId}`, tracks live presence,
 * streams activity events and manages offline / reconnection state.
 */
export function useProjectRoom(projectId: string | undefined) {
  const [presence, setPresence] = useState<PresenceMember[]>([]);
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [banner, setBanner] = useState<ConnectionBanner>({ kind: null, at: 0 });
  const joinedOnce = useRef(false);

  useEffect(() => {
    if (!projectId) return;
    const socket = connectSocket();
    joinedOnce.current = false;

    const join = (reconnected: boolean) => {
      socket.emit(SOCKET_EVENTS.PROJECT_JOIN, { projectId, reconnected });
      joinedOnce.current = true;
    };

    const onConnect = () => {
      const wasOffline = socket.recovered || joinedOnce.current;
      setConnectionState(joinedOnce.current ? 'reconnecting' : 'connecting');
      join(joinedOnce.current);
      if (wasOffline && joinedOnce.current) {
        setBanner({ kind: 'restored', at: Date.now() });
        window.setTimeout(() => setBanner({ kind: 'syncing', at: Date.now() }), 1200);
      }
      if (socket.connected && !joinedOnce.current) join(false);
      setConnectionState('online');
    };

    const onDisconnect = () => {
      setConnectionState('offline');
      setBanner({ kind: 'offline', at: Date.now() });
    };

    const onPresence = (event: PresenceUpdateEvent) => {
      if (event.projectId !== projectId) return;
      setPresence(event.members);
      setConnectionState((prev) => (prev === 'offline' ? prev : 'online'));
      setBanner((prev) => (prev.kind === 'syncing' ? { kind: 'synced', at: Date.now() } : prev));
    };

    const onSynced = () => {
      setBanner((prev) => (prev.kind === 'syncing' || prev.kind === 'restored' ? { kind: 'synced', at: Date.now() } : prev));
    };

    const onActivity = (event: ActivityNewEvent) => {
      if (event.projectId !== projectId) return;
      setLiveActivities((prev) => [event.activity, ...prev.filter((a) => a.id !== event.activity.id)].slice(0, 60));
    };

    const onReconnected = () => {
      setConnectionState('online');
      setBanner({ kind: 'syncing', at: Date.now() });
    };

    const onBrowserOnline = () => {
      if (!socket.connected) socket.connect();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);
    socket.on(SOCKET_EVENTS.SYNC_RESPONSE, onSynced);
    socket.on(SOCKET_EVENTS.ACTIVITY_NEW, onActivity);
    socket.on(SOCKET_EVENTS.CONNECTION_RECONNECTED, onReconnected);
    window.addEventListener('online', onBrowserOnline);

    if (socket.connected) {
      join(false);
      setConnectionState('online');
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);
      socket.off(SOCKET_EVENTS.SYNC_RESPONSE, onSynced);
      socket.off(SOCKET_EVENTS.ACTIVITY_NEW, onActivity);
      socket.off(SOCKET_EVENTS.CONNECTION_RECONNECTED, onReconnected);
      window.removeEventListener('online', onBrowserOnline);
      if (joinedOnce.current && socket.connected) {
        socket.emit(SOCKET_EVENTS.PROJECT_LEAVE, { projectId });
      }
      joinedOnce.current = false;
      setPresence([]);
      setLiveActivities([]);
    };
  }, [projectId]);

  useEffect(() => {
    if (banner.kind !== 'synced') return;
    const timer = window.setTimeout(() => setBanner({ kind: null, at: 0 }), 3000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const onlineMembers = presence.filter((m) => m.online);
  return { presence, onlineMembers, liveActivities, connectionState, banner };
}
