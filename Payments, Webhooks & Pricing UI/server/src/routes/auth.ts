import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { asyncHandler, HttpError, validate } from '../utils/http.js';

const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const registerSchema = loginSchema.extend({ name: z.string().min(2).max(80), workspaceName: z.string().min(2).max(80) });
const slugify = (value: string) => `${value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 7)}`;
const issueToken = (userId: string, tenantId: string) => jwt.sign({ tenantId }, env.JWT_SECRET, { subject: userId, expiresIn: '7d' });

router.post('/register', asyncHandler(async (req, res) => {
  const input = validate(registerSchema, req.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new HttpError(409, 'An account with this email already exists.', 'EMAIL_IN_USE');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash } });
    const tenant = await tx.tenant.create({ data: { name: input.workspaceName, slug: slugify(input.workspaceName) } });
    await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: 'OWNER' } });
    await tx.subscription.create({ data: { tenantId: tenant.id } });
    return { user, tenant };
  });
  res.status(201).json({ success: true, data: { token: issueToken(result.user.id, result.tenant.id), user: { id: result.user.id, name: result.user.name, email: result.user.email, role: 'OWNER', tenantName: result.tenant.name } } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { memberships: { include: { tenant: true }, take: 1 } } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
  const membership = user.memberships[0];
  if (!membership) throw new HttpError(403, 'This account does not belong to a workspace.', 'NO_WORKSPACE');
  res.json({ success: true, data: { token: issueToken(user.id, membership.tenantId), user: { id: user.id, name: user.name, email: user.email, role: membership.role, tenantName: membership.tenant.name } } });
}));

export default router;
