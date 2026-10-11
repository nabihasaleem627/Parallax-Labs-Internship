import { Router } from 'express';
import { store } from '../db/store.js';
import { requireAuth, requireRole, serializeUser, type AuthedRequest } from '../middleware/auth.js';
import { adminUpdateUserSchema } from '../validation/schemas.js';
import { parseBody } from '../utils/http.js';
import type { Department, User } from '../types.js';

export const usersRouter = Router();

usersRouter.get('/supervisors', requireAuth, (_req, res) => {
  const supervisors = store
    .filter('users', (u: User) => u.role === 'supervisor')
    .map(serializeUser);
  res.json({ supervisors });
});

usersRouter.get('/students', requireAuth, (_req, res) => {
  const students = store.filter('users', (u: User) => u.role === 'student').map(serializeUser);
  res.json({ students });
});

usersRouter.get('/departments', requireAuth, (_req, res) => {
  res.json({ departments: store.collection('departments') as Department[] });
});

// Admin: manage users
usersRouter.get('/', requireAuth, requireRole('admin'), (_req, res) => {
  const users = (store.collection('users') as User[]).map(serializeUser);
  res.json({ users });
});

usersRouter.patch('/:userId', requireAuth, requireRole('admin'), (req: AuthedRequest, res) => {
  const input = parseBody(adminUpdateUserSchema, req, res);
  if (!input) return;
  const user = store.find('users', (u: User) => u.id === req.params.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const updated = store.update('users', user.id, input);
  res.json({ user: serializeUser(updated as User) });
});

usersRouter.delete('/:userId', requireAuth, requireRole('admin'), (req, res) => {
  const user = store.find('users', (u: User) => u.id === req.params.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (user.role === 'admin') {
    res.status(400).json({ error: 'Admin accounts cannot be deleted' });
    return;
  }
  store.remove('users', user.id);
  res.json({ message: 'User deleted' });
});
