import { io, type Socket } from 'socket.io-client';
import { getToken } from '../api/client';

let socket: Socket | null = null;

/**
 * Single authenticated Socket.io connection per session.
 * Connects to the same origin; the Vite dev server proxies /socket.io
 * to the backend so this also works behind the preview proxy.
 */
export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket) return socket;
  socket = io('/', {
    auth: { token: getToken() ?? '' },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 4000,
    timeout: 10000,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function reconnectSocketWithToken(): Socket {
  disconnectSocket();
  return connectSocket();
}
