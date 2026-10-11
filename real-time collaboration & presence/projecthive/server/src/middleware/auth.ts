import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { store } from '../db/store.js';
import type { Role, User } from '../types.js';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export interface AuthedRequest extends Request {
  user?: User;
}

export function signToken(user: User): string {
  return jwt.sign({ sub: user.id, role: user.role } satisfies JwtPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const payload = verifyToken(token);
  const user = payload ? store.find('users', (u: User) => u.id === payload.sub) : undefined;
  if (!payload || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
}

export function serializeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
