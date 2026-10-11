import { randomUUID } from 'node:crypto';
import { store } from '../db/store.js';
import type { Activity, Notification, User } from '../types.js';

export function recordActivity(
  projectId: string,
  userId: string,
  type: Activity['type'],
  message: string,
): Activity {
  const activity = store.insert('activities', {
    id: randomUUID(),
    projectId,
    userId,
    type,
    message,
    createdAt: new Date().toISOString(),
  } as Omit<Activity, 'id'>) as Activity;
  return activity;
}

export function notify(
  userId: string,
  type: Notification['type'],
  title: string,
  body: string,
  projectId: string | null,
): Notification {
  return store.insert('notifications', {
    id: randomUUID(),
    userId,
    projectId,
    type,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  } as Omit<Notification, 'id'>) as Notification;
}

export function notifyProjectMembers(
  projectId: string,
  exceptUserId: string,
  type: Notification['type'],
  title: string,
  body: string,
): Notification[] {
  const memberIds = store
    .filter('projectMembers', (m) => m.projectId === projectId)
    .map((m) => m.userId)
    .filter((id) => id !== exceptUserId);
  return [...new Set(memberIds)].map((id) => notify(id, type, title, body, projectId));
}

export function userName(userId: string | null): string {
  if (!userId) return 'Someone';
  return store.find('users', (u: User) => u.id === userId)?.name ?? 'Someone';
}
