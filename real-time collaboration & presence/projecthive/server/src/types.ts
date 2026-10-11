export type Role = 'student' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department: string;
  avatarColor: string;
  title?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
}

export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'pending';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  departmentId: string;
  supervisorId: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  deadline: string;
  techStack: string[];
  milestones: Milestone[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'student' | 'supervisor';
  joinedAt: string;
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  content: string;
  savedBy: string;
  createdAt: string;
}

export interface ResearchSection {
  id: string;
  projectId: string;
  key: 'questions' | 'objectives' | 'literature' | 'methodology' | 'references' | 'findings';
  title: string;
  documentId: string;
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
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  type:
    | 'presence.join'
    | 'presence.leave'
    | 'document.update'
    | 'document.conflict'
    | 'task.create'
    | 'task.update'
    | 'task.delete'
    | 'comment.create'
    | 'comment.resolve'
    | 'file.upload'
    | 'file.delete'
    | 'meeting.create'
    | 'feedback.add';
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  projectId: string | null;
  type: 'comment' | 'feedback' | 'task' | 'document' | 'deadline' | 'meeting';
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
  storageKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
}

export interface PresenceMember {
  userId: string;
  name: string;
  role: Role;
  department: string;
  avatarColor: string;
  activity: string;
  online: boolean;
  lastSeen: string;
}

export interface DbShape {
  users: User[];
  departments: Department[];
  projects: Project[];
  projectMembers: ProjectMember[];
  tasks: Task[];
  collaborativeDocuments: CollaborativeDocument[];
  documentVersions: DocumentVersion[];
  researchSections: ResearchSection[];
  comments: Comment[];
  meetings: Meeting[];
  activities: Activity[];
  notifications: Notification[];
  files: ProjectFile[];
  resetTokens: ResetToken[];
}
