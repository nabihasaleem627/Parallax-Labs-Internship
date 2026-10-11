import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(['student', 'supervisor']).default('student'),
  department: z.string().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(72),
});

export const createProjectSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  category: z.string().min(2).max(80),
  departmentId: z.string().min(1),
  supervisorId: z.string().min(1),
  startDate: z.string().datetime(),
  deadline: z.string().datetime(),
  techStack: z.array(z.string().min(1).max(40)).max(12).default([]),
  memberIds: z.array(z.string().min(1)).default([]),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).max(4000).optional(),
  category: z.string().min(2).max(80).optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'pending']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  deadline: z.string().datetime().optional(),
  techStack: z.array(z.string().min(1).max(40)).max(12).optional(),
  milestones: z
    .array(z.object({ id: z.string(), title: z.string(), dueDate: z.string(), completed: z.boolean() }))
    .optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(2000).default(''),
  assigneeId: z.string().nullable().default(null),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'completed']).default('backlog'),
  deadline: z.string().datetime().nullable().default(null),
});

export const updateTaskSchema = createTaskSchema.partial();

export const moveTaskSchema = z.object({
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'completed']),
});

export const saveDocumentSchema = z.object({
  content: z.string().max(500_000),
  baseVersion: z.number().int().min(0),
});

export const createCommentSchema = z.object({
  targetType: z.enum(['project', 'task', 'document', 'meeting']),
  targetId: z.string().min(1),
  body: z.string().min(1).max(2000),
  parentId: z.string().nullable().default(null),
});

export const createMeetingSchema = z.object({
  title: z.string().min(3).max(120),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).default(60),
  agenda: z.array(z.string().min(1).max(200)).max(12).default([]),
});

export const uploadFileSchema = z.object({
  name: z.string().min(1).max(160),
  type: z.string().min(1).max(120),
  contentBase64: z.string().max(12_000_000),
});

export const renameFileSchema = z.object({ name: z.string().min(1).max(160) });

export const adminUpdateUserSchema = z.object({
  role: z.enum(['student', 'supervisor', 'admin']).optional(),
  department: z.string().min(2).max(80).optional(),
});
