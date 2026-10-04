import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

type TokenPayload = { sub: string; tenantId: string };
export function requireBillingManager(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || !['OWNER', 'ADMIN'].includes(req.auth.role)) {
    return res.status(403).json({ success: false, error: { code: 'BILLING_ACCESS_DENIED', message: 'Only workspace owners and admins can manage billing.' } });
  }
  next();
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' } });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const membership = await prisma.membership.findUnique({ where: { userId_tenantId: { userId: payload.sub, tenantId: payload.tenantId } } });
    if (!membership) return res.status(403).json({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'You do not have access to this workspace.' } });
    req.auth = { userId: payload.sub, tenantId: payload.tenantId, role: membership.role };
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Your session is invalid or has expired.' } });
  }
}
