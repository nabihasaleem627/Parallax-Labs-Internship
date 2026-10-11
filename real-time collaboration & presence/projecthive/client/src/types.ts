export type Role = 'student' | 'supervisor' | 'admin';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatarColor: string;
  title?: string;
  createdAt: string;
  membershipRole?: 'student' | 'supervisor';
}

export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'pending';

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  departmentId: string;
  department?: string;
  supervisorId: string;
  supervisor?: User | null;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  deadline: string;
  techStack: string[];
  milestones: Milestone[];
  members?: User[];
  stats?: { totalTasks: number; completedTasks: number; pendingTasks: number };
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  projectTitle?: string;
}

export interface CollaborativeDocument {
  id: string;
  projectId: string;
  title: string;
  kind: 'notes' | 'research' | 'meeting';
  content: string;
  version: number;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  savedBy: string;
  savedByName?: string;
  createdAt: string;
}

export interface ResearchSection {
  id: string;
  projectId: string;
  key: string;
  title: string;
  documentId: string;
  document: CollaborativeDocument | null;
}

export interface Comment {
  id: string;
  projectId: string;
  targetType: 'project' | 'task' | 'document' | 'meeting';
  targetId: string;
  authorId: string;
  body: string;
  parentId: string | null;
  resolved: boolean;
  createdAt: string;
  author?: User;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  supervisorId: string | null;
  agenda: string[];
  notesDocumentId: string | null;
  status: 'upcoming' | 'completed';
  projectTitle?: string;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  avatarColor: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  projectId: string | null;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: string;
  sizeBytes: number;
  version: number;
  uploadedById: string;
  uploadedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresenceMember {
  userId: string;
  name: string;
  role: Role;
  department: string;
  avatarColor: string;
  activity: string;
  online: boolean;
  connectedAt: string;
}

export interface CalendarEvent {
  id: string;
  type: 'milestone' | 'meeting' | 'task' | 'deadline';
  title: string;
  date: string;
  meta?: string;
}

export type SaveStatus = 'saved' | 'saving' | 'syncing' | 'offline' | 'pending' | 'conflict' | 'loading';

export interface ConflictInfo {
  documentId: string;
  yourVersion: number;
  serverVersion: number;
  serverContent: string;
  serverUpdatedByName: string;
  serverUpdatedAt: string;
}
