import type { NextFunction, Response } from 'express';
import { store } from '../db/store.js';
import type { AuthedRequest } from './auth.js';
import type { Project, ProjectMember, User } from '../types.js';

export function isProjectMember(userId: string, projectId: string): boolean {
  if (store.find('users', (u: User) => u.id === userId)?.role === 'admin') return true;
  return store.collection('projectMembers').some(
    (m: ProjectMember) => m.projectId === projectId && m.userId === userId,
  );
}

export function getProject(projectId: string): Project | undefined {
  return store.find('projects', (p: Project) => p.id === projectId);
}

/** 404 when project does not exist, 403 when the requester is not a member. */
export function requireProjectAccess(req: AuthedRequest, res: Response, next: NextFunction): void {
  const projectId = req.params.projectId;
  const project = getProject(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (!req.user || !isProjectMember(req.user.id, projectId)) {
    res.status(403).json({ error: 'You are not a member of this project' });
    return;
  }
  next();
}
