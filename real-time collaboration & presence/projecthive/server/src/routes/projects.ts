import { Router } from 'express';
import { store } from '../db/store.js';
import { requireAuth, requireRole, serializeUser, type AuthedRequest } from '../middleware/auth.js';
import { getProject, isProjectMember, requireProjectAccess } from '../middleware/access.js';
import { createProjectSchema, updateProjectSchema } from '../validation/schemas.js';
import { asyncRoute, parseBody } from '../utils/http.js';
import type { CollaborativeDocument, Meeting, Project, ProjectMember, Task, User } from '../types.js';

export const projectsRouter = Router();

function projectView(project: Project) {
  const members = store
    .filter('projectMembers', (m: ProjectMember) => m.projectId === project.id)
    .map((m) => {
      const user = getUser(m.userId);
      return user ? { ...serializeUser(user), membershipRole: m.role } : null;
    })
    .filter(Boolean);
  const supervisor = getUser(project.supervisorId);
  const tasks = store.filter('tasks', (t: Task) => t.projectId === project.id);
  return {
    ...project,
    department: store.find('departments', (d) => d.id === project.departmentId)?.name ?? '',
    members,
    supervisor: supervisor ? serializeUser(supervisor) : null,
    stats: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      pendingTasks: tasks.filter((t) => t.status !== 'completed').length,
    },
  };
}

function getUser(id: string): User | undefined {
  return store.find('users', (u: User) => u.id === id);
}

// GET /api/projects — my projects (admin sees all)
projectsRouter.get('/', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const projects = store
    .filter('projects', (p: Project) => user.role === 'admin' || isProjectMember(user.id, p.id))
    .map(projectView);
  res.json({ projects });
});

// GET /api/projects/dashboard — aggregated statistics
projectsRouter.get('/dashboard', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const myProjects = store.filter('projects', (p: Project) => user.role === 'admin' || isProjectMember(user.id, p.id));
  const ids = new Set(myProjects.map((p) => p.id));
  const tasks = store.filter('tasks', (t: Task) => ids.has(t.projectId));
  const meetings = store.filter('meetings', (m: Meeting) => ids.has(m.projectId) && m.status === 'upcoming');
  res.json({
    stats: {
      activeProjects: myProjects.filter((p) => p.status === 'active').length,
      completedProjects: myProjects.filter((p) => p.status === 'completed').length,
      pendingTasks: tasks.filter((t) => t.status !== 'completed' && (t.assigneeId === user.id || user.role !== 'student')).length,
      upcomingMeetings: meetings.filter((m) => new Date(m.scheduledAt).getTime() >= Date.now() - 86_400_000).length,
    },
    projects: myProjects.map(projectView),
    upcomingMeetings: meetings
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, 4)
      .map((m) => ({ ...m, projectTitle: getProject(m.projectId)?.title ?? '' })),
    myTasks: tasks
      .filter((t) => t.assigneeId === user.id && t.status !== 'completed')
      .sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))
      .slice(0, 5)
      .map((t) => ({ ...t, projectTitle: getProject(t.projectId)?.title ?? '' })),
  });
});

// POST /api/projects
projectsRouter.post(
  '/',
  requireAuth,
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(createProjectSchema, req, res);
    if (!input) return;
    const supervisor = getUser(input.supervisorId);
    if (!supervisor || supervisor.role !== 'supervisor') {
      res.status(400).json({ error: 'A valid supervisor is required' });
      return;
    }
    const now = new Date().toISOString();
    const project = store.insert('projects', {
      title: input.title,
      description: input.description,
      category: input.category,
      departmentId: input.departmentId,
      supervisorId: input.supervisorId,
      status: 'active',
      progress: 0,
      startDate: input.startDate,
      deadline: input.deadline,
      techStack: input.techStack,
      milestones: [],
      createdBy: req.user!.id,
      createdAt: now,
      updatedAt: now,
    }) as Project;

    store.insert('projectMembers', { projectId: project.id, userId: req.user!.id, role: req.user!.role === 'student' ? 'student' : 'supervisor', joinedAt: now } as Omit<ProjectMember, 'id'>);
    store.insert('projectMembers', { projectId: project.id, userId: supervisor.id, role: 'supervisor', joinedAt: now } as Omit<ProjectMember, 'id'>);
    for (const memberId of input.memberIds) {
      if (memberId === req.user!.id || !getUser(memberId)) continue;
      store.insert('projectMembers', { projectId: project.id, userId: memberId, role: 'student', joinedAt: now } as Omit<ProjectMember, 'id'>);
    }
    store.insert('collaborativeDocuments', {
      projectId: project.id,
      title: 'Project Research Notes',
      kind: 'notes',
      content: `<h1>${input.title}</h1><p>${input.description}</p>`,
      version: 1,
      updatedBy: req.user!.id,
      createdAt: now,
      updatedAt: now,
    } as Omit<CollaborativeDocument, 'id'>);

    res.status(201).json({ project: projectView(project) });
  }),
);

// Everything below is scoped to one project and requires membership.
projectsRouter.use('/:projectId', requireAuth, requireProjectAccess);

projectsRouter.get('/:projectId', (req, res) => {
  res.json({ project: projectView(getProject(req.params.projectId)!) });
});

projectsRouter.patch(
  '/:projectId',
  asyncRoute(async (req: AuthedRequest, res) => {
    const input = parseBody(updateProjectSchema, req, res);
    if (!input) return;
    const project = getProject(req.params.projectId)!;
    const user = req.user!;
    const canManage = user.role === 'admin' || user.id === project.supervisorId || user.id === project.createdBy;
    if (!canManage) {
      res.status(403).json({ error: 'Only the supervisor, creator or an admin can update this project' });
      return;
    }
    const updated = store.update('projects', project.id, { ...input, updatedAt: new Date().toISOString() });
    res.json({ project: projectView(updated as Project) });
  }),
);

projectsRouter.delete('/:projectId', requireRole('admin', 'supervisor'), (req, res) => {
  store.remove('projects', req.params.projectId);
  res.json({ message: 'Project deleted' });
});

projectsRouter.post('/:projectId/members', requireAuth, (req: AuthedRequest, res) => {
  const userId = String(req.body?.userId ?? '');
  const user = getUser(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const existing = store.find('projectMembers', (m: ProjectMember) => m.projectId === req.params.projectId && m.userId === userId);
  if (existing) {
    res.status(409).json({ error: 'User is already a member' });
    return;
  }
  store.insert('projectMembers', {
    projectId: req.params.projectId,
    userId,
    role: user.role === 'supervisor' ? 'supervisor' : 'student',
    joinedAt: new Date().toISOString(),
  } as Omit<ProjectMember, 'id'>);
  res.status(201).json({ message: 'Member added', project: projectView(getProject(req.params.projectId)!) });
});

projectsRouter.delete('/:projectId/members/:userId', requireAuth, (req: AuthedRequest, res) => {
  const project = getProject(req.params.projectId)!;
  const user = req.user!;
  const isSelf = user.id === req.params.userId;
  const canManage = user.role === 'admin' || user.id === project.supervisorId || user.id === project.createdBy;
  if (!isSelf && !canManage) {
    res.status(403).json({ error: 'Not allowed to remove this member' });
    return;
  }
  const membership = store.find('projectMembers', (m: ProjectMember) => m.projectId === project.id && m.userId === req.params.userId);
  if (membership) store.remove('projectMembers', membership.id);
  res.json({ message: 'Member removed' });
});

// GET /api/projects/:projectId/calendar — merged deadlines, meetings, milestones
projectsRouter.get('/:projectId/calendar', (req, res) => {
  const projectId = req.params.projectId;
  const project = getProject(projectId)!;
  const events: { id: string; type: 'milestone' | 'meeting' | 'task' | 'deadline'; title: string; date: string; meta?: string }[] = [
    { id: 'project-deadline', type: 'deadline', title: 'Project deadline', date: project.deadline },
    ...project.milestones.map((m) => ({ id: `ms-${m.id}`, type: 'milestone' as const, title: m.title, date: m.dueDate, meta: m.completed ? 'Completed' : 'Pending' })),
    ...store.filter('meetings', (m: Meeting) => m.projectId === projectId).map((m) => ({ id: `mt-${m.id}`, type: 'meeting' as const, title: m.title, date: m.scheduledAt })),
    ...store
      .filter('tasks', (t: Task) => t.projectId === projectId && Boolean(t.deadline))
      .map((t) => ({ id: `tk-${t.id}`, type: 'task' as const, title: t.title, date: t.deadline!, meta: t.status })),
  ];
  res.json({ events: events.sort((a, b) => a.date.localeCompare(b.date)) });
});
