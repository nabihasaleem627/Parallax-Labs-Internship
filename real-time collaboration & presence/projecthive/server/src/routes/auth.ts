import { randomBytes, createHash } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../db/store.js';
import { requireAuth, serializeUser, signToken, type AuthedRequest } from '../middleware/auth.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validation/schemas.js';
import { asyncRoute, parseBody } from '../utils/http.js';
import type { ResetToken, User } from '../types.js';

export const authRouter = Router();

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];

authRouter.post(
  '/register',
  asyncRoute(async (req, res) => {
    const input = parseBody(registerSchema, req, res);
    if (!input) return;
    const exists = store.find('users', (u: User) => u.email.toLowerCase() === input.email.toLowerCase());
    if (exists) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    const user = store.insert('users', {
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 10),
      role: input.role,
      department: input.department,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: new Date().toISOString(),
    }) as User;
    res.status(201).json({ token: signToken(user), user: serializeUser(user) });
  }),
);

authRouter.post(
  '/login',
  asyncRoute(async (req, res) => {
    const input = parseBody(loginSchema, req, res);
    if (!input) return;
    const user = store.find('users', (u: User) => u.email.toLowerCase() === input.email.toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.json({ token: signToken(user), user: serializeUser(user) });
  }),
);

authRouter.post('/forgot-password', (req, res) => {
  const input = parseBody(forgotPasswordSchema, req, res);
  if (!input) return;
  const user = store.find('users', (u: User) => u.email.toLowerCase() === input.email.toLowerCase());
  // Always respond the same way to avoid leaking which emails exist.
  const response = { message: 'If an account exists for that email, a reset link has been sent.' };
  if (!user) {
    res.json(response);
    return;
  }
  const rawToken = randomBytes(24).toString('hex');
  store.insert('resetTokens', {
    userId: user.id,
    tokenHash: createHash('sha256').update(rawToken).digest('hex'),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    used: false,
  } as Omit<ResetToken, 'id'>);
  // Demo mode: no email service is configured, so the token is returned here.
  res.json({ ...response, demoResetToken: rawToken });
});

authRouter.post(
  '/reset-password',
  asyncRoute(async (req, res) => {
    const input = parseBody(resetPasswordSchema, req, res);
    if (!input) return;
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const record = store.find('resetTokens', (t: ResetToken) => t.tokenHash === tokenHash && !t.used);
    if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
      res.status(400).json({ error: 'Reset token is invalid or has expired' });
      return;
    }
    record.used = true;
    const user = store.find('users', (u: User) => u.id === record.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    user.passwordHash = await bcrypt.hash(input.password, 10);
    store.flush();
    res.json({ message: 'Password has been reset. You can now sign in.' });
  }),
);

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: serializeUser(req.user!) });
});
