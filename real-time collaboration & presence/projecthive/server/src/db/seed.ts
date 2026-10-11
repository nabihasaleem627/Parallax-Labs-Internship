import bcrypt from 'bcryptjs';
import type { DbShape } from '../types.js';
import { store } from './store.js';

const iso = (month: number, day: number, hour = 9, minute = 0) =>
  new Date(Date.UTC(2026, month - 1, day, hour - 5, minute)).toISOString(); // PKT wall time

export async function buildSeedData(): Promise<DbShape> {
  const hash = await bcrypt.hash('password123', 10);
  const db: DbShape = {
    users: [], departments: [], projects: [], projectMembers: [], tasks: [],
    collaborativeDocuments: [], documentVersions: [], researchSections: [], comments: [],
    meetings: [], activities: [], notifications: [], files: [], resetTokens: [],
  };

  db.departments = [
    { id: 'dep-cs', name: 'Computer Science' },
    { id: 'dep-se', name: 'Software Engineering' },
    { id: 'dep-ee', name: 'Electrical Engineering' },
    { id: 'dep-ba', name: 'Business Administration' },
  ];

  const mkUser = (id: string, name: string, email: string, role: DbShape['users'][number]['role'], department: string, avatarColor: string, title?: string) =>
    ({ id, name, email, passwordHash: hash, role, department, avatarColor, title, createdAt: iso(8, 1) });

  db.users = [
    mkUser('u-nabiha', 'Nabiha Saleem', 'nabiha@university.edu', 'student', 'Computer Science', '#6366f1'),
    mkUser('u-sarah', 'Sarah Khan', 'sarah@university.edu', 'student', 'Computer Science', '#ec4899'),
    mkUser('u-ahmed-ali', 'Ahmed Ali', 'ahmed.ali@university.edu', 'student', 'Computer Science', '#0ea5e9'),
    mkUser('u-hassan', 'Hassan Raza', 'hassan@university.edu', 'student', 'Computer Science', '#f59e0b'),
    mkUser('u-dr-ahmed', 'Dr. Ahmed Khan', 'ahmed.khan@university.edu', 'supervisor', 'Computer Science', '#10b981', 'Associate Professor'),
    mkUser('u-admin', 'System Administrator', 'admin@projecthive.edu', 'admin', 'Administration', '#64748b'),
  ];

  db.projects = [
    {
      id: 'p-sca',
      title: 'Smart Campus Assistant',
      description:
        'Smart Campus Assistant aims to provide students with a centralized platform for finding university services, tracking academic tasks, and receiving personalized campus information.',
      category: 'Final Year Project',
      departmentId: 'dep-cs',
      supervisorId: 'u-dr-ahmed',
      status: 'active',
      progress: 72,
      startDate: iso(9, 1),
      deadline: iso(12, 18),
      techStack: ['React', 'Node.js', 'PostgreSQL', 'Socket.io'],
      milestones: [
        { id: 'm1', title: 'Proposal Approved', dueDate: iso(9, 10), completed: true },
        { id: 'm2', title: 'Literature Review Completed', dueDate: iso(10, 1), completed: true },
        { id: 'm3', title: 'Real-Time Collaboration Demo (Week 4)', dueDate: iso(10, 15), completed: false },
        { id: 'm4', title: 'Beta Release', dueDate: iso(11, 20), completed: false },
        { id: 'm5', title: 'Final Report & Defense', dueDate: iso(12, 18), completed: false },
      ],
      createdBy: 'u-nabiha',
      createdAt: iso(9, 1),
      updatedAt: iso(10, 10, 16, 30),
    },
    {
      id: 'p-attendance',
      title: 'AI-Powered Attendance System',
      description:
        'Face-recognition based attendance marking for lecture halls with anti-spoofing checks and instructor dashboards.',
      category: 'Final Year Project',
      departmentId: 'dep-cs',
      supervisorId: 'u-dr-ahmed',
      status: 'active',
      progress: 35,
      startDate: iso(9, 15),
      deadline: '2027-01-10T09:00:00.000Z',
      techStack: ['Python', 'OpenCV', 'FastAPI', 'React'],
      milestones: [
        { id: 'm1', title: 'Dataset Collection', dueDate: iso(10, 5), completed: true },
        { id: 'm2', title: 'Recognition Model v1', dueDate: iso(11, 2), completed: false },
      ],
      createdBy: 'u-ahmed-ali',
      createdAt: iso(9, 15),
      updatedAt: iso(10, 8, 11),
    },
    {
      id: 'p-events',
      title: 'Campus Event Portal',
      description: 'A portal for publishing, discovering and registering for university events and society activities.',
      category: 'Course Project',
      departmentId: 'dep-se',
      supervisorId: 'u-dr-ahmed',
      status: 'completed',
      progress: 100,
      startDate: iso(3, 1),
      deadline: iso(6, 30),
      techStack: ['React', 'Express', 'MongoDB'],
      milestones: [{ id: 'm1', title: 'Final Submission', dueDate: iso(6, 30), completed: true }],
      createdBy: 'u-sarah',
      createdAt: iso(3, 1),
      updatedAt: iso(6, 28),
    },
  ];
  const member = (id: string, projectId: string, userId: string, role: 'student' | 'supervisor', joined: string) =>
    ({ id, projectId, userId, role, joinedAt: joined });
  db.projectMembers = [
    member('pm1', 'p-sca', 'u-nabiha', 'student', iso(9, 1)),
    member('pm2', 'p-sca', 'u-sarah', 'student', iso(9, 1)),
    member('pm3', 'p-sca', 'u-ahmed-ali', 'student', iso(9, 2)),
    member('pm4', 'p-sca', 'u-hassan', 'student', iso(9, 2)),
    member('pm5', 'p-sca', 'u-dr-ahmed', 'supervisor', iso(9, 1)),
    member('pm6', 'p-attendance', 'u-ahmed-ali', 'student', iso(9, 15)),
    member('pm7', 'p-attendance', 'u-hassan', 'student', iso(9, 15)),
    member('pm8', 'p-attendance', 'u-dr-ahmed', 'supervisor', iso(9, 15)),
    member('pm9', 'p-events', 'u-sarah', 'student', iso(3, 1)),
    member('pm10', 'p-events', 'u-nabiha', 'student', iso(3, 1)),
    member('pm11', 'p-events', 'u-dr-ahmed', 'supervisor', iso(3, 1)),
  ];

  const task = (
    id: string, title: string, description: string, assigneeId: string | null,
    priority: DbShape['tasks'][number]['priority'], status: DbShape['tasks'][number]['status'],
    deadline: string | null, commentCount = 0,
  ) => ({
    id, projectId: 'p-sca', title, description, assigneeId, priority, status, deadline,
    commentCount, createdBy: 'u-nabiha', createdAt: iso(9, 20), updatedAt: iso(10, 9, 15),
  });
  db.tasks = [
    task('t-auth', 'Implement Authentication', 'JWT login, registration, role-based guards and password reset flow.', 'u-nabiha', 'high', 'in-progress', iso(10, 15), 2),
    task('t-sync', 'Real-Time Notes Sync', 'Socket.io document:update pipeline with version checking and broadcast.', 'u-sarah', 'high', 'in-progress', iso(10, 14), 1),
    task('t-presence', 'Presence System', 'Project room presence, join/leave broadcast and activity panel.', 'u-ahmed-ali', 'high', 'in-progress', iso(10, 13)),
    task('t-conflict', 'Conflict Resolution UI', 'Conflict dialog with Review / Load Latest / Keep Draft actions.', 'u-sarah', 'high', 'todo', iso(10, 16)),
    task('t-schema', 'Database Schema for Documents', 'Design collaborative_documents and document_versions tables.', 'u-hassan', 'medium', 'todo', iso(10, 18)),
    task('t-dashboard', 'Project Dashboard Layout', 'Statistics cards, project cards and responsive grid.', 'u-sarah', 'medium', 'review', iso(10, 12)),
    task('t-offline', 'Offline Mode & Reconnection', 'Pending-change queue, reconnect banner and sync on restore.', 'u-nabiha', 'medium', 'review', iso(10, 17)),
    task('t-report5', 'Write Final Report — Chapter 5', 'Testing and results chapter including real-time test evidence.', null, 'medium', 'backlog', iso(11, 25)),
    task('t-slides', 'Prepare Defense Slides', '', null, 'low', 'backlog', iso(12, 10)),
    task('t-proposal', 'Proposal Document', 'Approved by supervisor on Sep 10.', 'u-nabiha', 'high', 'completed', iso(9, 10)),
    task('t-litreview', 'Literature Review Draft', 'Covered 24 sources on collaborative editing and OT/CRDT approaches.', 'u-ahmed-ali', 'high', 'completed', iso(10, 1)),
    task('t-env', 'Setup Development Environment', 'Monorepo, ESLint, Prettier, CI pipeline.', 'u-hassan', 'low', 'completed', iso(9, 8)),
  ];

  const notesHtml = `<h1>Project Research Notes</h1>
<p>Smart Campus Assistant aims to provide students with a centralized platform for finding university services, tracking academic tasks, and receiving personalized campus information.</p>
<h2>Problem Statement</h2>
<p>University services are currently fragmented across notice boards, departmental websites and student societies. Students miss deadlines because there is no single, real-time source of academic information.</p>
<h2>Proposed Solution</h2>
<ul><li>Centralized service directory with search</li><li>Personalized task and deadline tracking</li><li><strong>Real-time collaboration</strong> between team members and supervisors</li><li>Notification engine for announcements and reminders</li></ul>
<h2>Week 4 Focus — Real-Time Collaboration</h2>
<p>This week we demonstrate multiplayer editing of project notes: presence, typing indicators, auto-save with versioned documents, and conflict detection instead of silent overwrites.</p>
<ul class="checklist"><li data-checked="true">Socket.io rooms per project</li><li data-checked="true">Presence broadcast on join/leave</li><li data-checked="true">Typing indicators</li><li data-checked="false">Conflict resolution UI review</li><li data-checked="false">Automated real-time test suite</li></ul>
<h2>References</h2>
<ol><li>Ellis et al., "Groupware: Computer-Supported Cooperative Work" (1991)</li><li>Shapiro et al., "A comprehensive study of Convergent and Commutative Replicated Data Types" (2011)</li><li><a href="https://socket.io/docs/v4/">Socket.io v4 documentation</a></li></ol>`;

  const doc = (
    id: string, title: string, kind: DbShape['collaborativeDocuments'][number]['kind'],
    content: string, version: number, updatedBy: string | null, updatedAt: string,
  ) => ({ id, projectId: 'p-sca', title, kind, content, version, updatedBy, createdAt: iso(9, 20), updatedAt });

  db.collaborativeDocuments = [
    doc('doc-notes', 'Project Research Notes', 'notes', notesHtml, 12, 'u-nabiha', iso(10, 11, 10, 45)),
    doc('doc-questions', 'Research Questions', 'research', `<h2>Research Questions</h2><ol><li>How can multiple students edit the same project document simultaneously without losing each other's work?</li><li>What is the minimum event contract required for presence, typing and versioned synchronization?</li><li>How should conflicts be surfaced to users so no work is silently overwritten?</li></ol>`, 4, 'u-sarah', iso(10, 10, 12)),
    doc('doc-objectives', 'Objectives', 'research', `<h2>Objectives</h2><ul><li>Build a role-aware workspace for students, supervisors and admins</li><li>Deliver sub-second document synchronization across connected clients</li><li>Implement optimistic concurrency control with a versioned document model</li><li>Support offline editing with queued synchronization on reconnect</li></ul>`, 3, 'u-nabiha', iso(10, 9, 17)),
    doc('doc-literature', 'Literature Review', 'research', `<h2>Literature Review</h2><p>Collaborative editing research spans operation transformation (Ellis &amp; Gibbs, 1989) and CRDTs (Shapiro et al., 2011). Modern tools like Google Docs and Notion use centralized servers with OT-style reconciliation.</p><p>For a semester-scale team, <strong>server-authoritative versioned updates</strong> with explicit conflict resolution provide a practical middle ground between full OT and last-write-wins.</p>`, 7, 'u-sarah', iso(10, 11, 10, 42)),
    doc('doc-methodology', 'Methodology', 'research', `<h2>Methodology</h2><p>Agile two-week sprints with supervisor reviews. Architecture: React SPA talking to an Express REST API, with Socket.io handling the real-time channel. Documents are stored with a monotonically increasing version; clients submit <em>(content, baseVersion)</em> pairs.</p><ol><li>Requirement gathering with supervisor</li><li>Design of event contract and data model</li><li>Incremental delivery: auth → workspace → real-time notes</li><li>Automated real-time tests with two concurrent socket clients</li></ol>`, 5, 'u-ahmed-ali', iso(10, 11, 9, 58)),
    doc('doc-references', 'References', 'research', `<h2>References</h2><ol><li>Ellis, C. &amp; Gibbs, S. "Concurrency Control in Groupware Systems." ACM SIGMOD, 1989.</li><li>Shapiro, M. et al. "Conflict-free Replicated Data Types." INRIA, 2011.</li><li>Socket.io Documentation — https://socket.io/docs/v4/</li><li>Nielsen, J. "Response Times: The 3 Important Limits." 1993.</li></ol>`, 2, 'u-hassan', iso(10, 5, 14)),
    doc('doc-findings', 'Research Findings', 'research', `<h2>Research Findings</h2><ul><li>Debounced full-document sync (≈600 ms) is sufficient for teams of 4–6 editors</li><li>Presence rooms keep event volume low; only members of a project receive updates</li><li>Version-based rejection prevents silent overwrites in 100% of concurrent-write tests</li></ul>`, 3, 'u-nabiha', iso(10, 8, 16)),
    doc('doc-meeting-1', 'Supervisor Meeting — Oct 15', 'meeting', `<h2>Meeting Notes</h2><p>Agenda: Literature Review, System Architecture, Week 4 Progress.</p><ul class="checklist"><li data-checked="false">Present real-time demo with two browsers</li><li data-checked="false">Discuss conflict UX with supervisor</li></ul>`, 1, null, iso(10, 9, 10)),
  ];

  db.documentVersions = [
    { id: 'dv1', documentId: 'doc-notes', version: 10, content: notesHtml.replace('Week 4 Focus', 'Week 4 Focus (draft)'), savedBy: 'u-sarah', createdAt: iso(10, 10, 15, 20) },
    { id: 'dv2', documentId: 'doc-notes', version: 11, content: notesHtml, savedBy: 'u-ahmed-ali', createdAt: iso(10, 11, 9, 30) },
    { id: 'dv3', documentId: 'doc-notes', version: 12, content: notesHtml, savedBy: 'u-nabiha', createdAt: iso(10, 11, 10, 45) },
  ];

  const rs = (id: string, key: DbShape['researchSections'][number]['key'], title: string, documentId: string) =>
    ({ id, projectId: 'p-sca', key, title, documentId });
  db.researchSections = [
    rs('rs1', 'questions', 'Research Questions', 'doc-questions'),
    rs('rs2', 'objectives', 'Objectives', 'doc-objectives'),
    rs('rs3', 'literature', 'Literature Review', 'doc-literature'),
    rs('rs4', 'methodology', 'Methodology', 'doc-methodology'),
    rs('rs5', 'references', 'References', 'doc-references'),
    rs('rs6', 'findings', 'Research Findings', 'doc-findings'),
  ];

  const cm = (id: string, targetType: DbShape['comments'][number]['targetType'], targetId: string, authorId: string, body: string, createdAt: string, parentId: string | null = null, resolved = false) =>
    ({ id, projectId: 'p-sca', targetType, targetId, authorId, body, parentId, resolved, createdAt });
  db.comments = [
    cm('c1', 'document', 'doc-literature', 'u-sarah', 'Should we add another research source here? The CRDT survey feels under-cited.', iso(10, 11, 10, 42)),
    cm('c2', 'document', 'doc-literature', 'u-nabiha', "Yes, I'll update the literature review with the Kleppmann paper tonight.", iso(10, 11, 10, 44), 'c1'),
    cm('c3', 'task', 't-auth', 'u-dr-ahmed', 'Make sure password reset tokens expire — good security practice for the demo.', iso(10, 10, 11, 5)),
    cm('c4', 'task', 't-auth', 'u-nabiha', 'Done — tokens now expire after 30 minutes.', iso(10, 10, 12, 30), 'c3', true),
    cm('c5', 'project', 'p-sca', 'u-dr-ahmed', 'Week 3 review: solid progress on the workspace UI. For Week 4 I want to see live presence and conflict handling working end-to-end.', iso(10, 9, 17, 15)),
    cm('c6', 'task', 't-sync', 'u-sarah', 'Broadcast latency measured at ~40ms on campus Wi-Fi with 4 concurrent editors.', iso(10, 11, 9, 50)),
  ];

  db.meetings = [
    { id: 'mt1', projectId: 'p-sca', title: 'Supervisor Meeting', scheduledAt: iso(10, 15, 14), durationMinutes: 60, supervisorId: 'u-dr-ahmed', agenda: ['Literature Review', 'System Architecture', 'Week 4 Progress'], notesDocumentId: 'doc-meeting-1', status: 'upcoming', createdAt: iso(10, 8) },
    { id: 'mt2', projectId: 'p-sca', title: 'Weekly Team Sync', scheduledAt: iso(10, 13, 17), durationMinutes: 45, supervisorId: null, agenda: ['Sprint review', 'Blockers', 'Demo rehearsal'], notesDocumentId: null, status: 'upcoming', createdAt: iso(10, 6) },
    { id: 'mt3', projectId: 'p-sca', title: 'Proposal Review', scheduledAt: iso(9, 10, 11), durationMinutes: 30, supervisorId: 'u-dr-ahmed', agenda: ['Proposal walkthrough', 'Scope agreement'], notesDocumentId: null, status: 'completed', createdAt: iso(9, 5) },
  ];

  const act = (id: string, userId: string, type: DbShape['activities'][number]['type'], message: string, createdAt: string) =>
    ({ id, projectId: 'p-sca', userId, type, message, createdAt });
  db.activities = [
    act('a1', 'u-nabiha', 'document.update', 'Nabiha updated the research notes', iso(10, 11, 10, 45)),
    act('a2', 'u-sarah', 'document.update', 'Sarah edited literature review', iso(10, 11, 10, 42)),
    act('a3', 'u-sarah', 'presence.join', 'Sarah joined the project', iso(10, 11, 10, 42)),
    act('a4', 'u-ahmed-ali', 'document.update', 'Ahmed started editing notes', iso(10, 11, 10, 43)),
    act('a5', 'u-ahmed-ali', 'presence.join', 'Ahmed joined the project', iso(10, 11, 9, 55)),
    act('a6', 'u-dr-ahmed', 'feedback.add', 'Supervisor added feedback on Week 3 review', iso(10, 9, 17, 15)),
    act('a7', 'u-nabiha', 'task.update', 'Nabiha moved "Implement Authentication" to In Progress', iso(10, 9, 12, 10)),
    act('a8', 'u-hassan', 'file.upload', 'Project documentation uploaded — Final Report.pdf', iso(10, 10, 16, 20)),
    act('a9', 'u-sarah', 'comment.create', 'Sarah commented on Literature Review', iso(10, 11, 10, 42)),
    act('a10', 'u-nabiha', 'meeting.create', 'Nabiha scheduled Supervisor Meeting for Oct 15', iso(10, 8, 10, 5)),
  ];

  const notif = (id: string, userId: string, type: DbShape['notifications'][number]['type'], title: string, body: string, createdAt: string, read = false) =>
    ({ id, userId, projectId: 'p-sca', type, title, body, read, createdAt });
  db.notifications = [
    notif('n1', 'u-nabiha', 'comment', 'Sarah commented on Research Notes', '"Should we add another research source here?"', iso(10, 11, 10, 42)),
    notif('n2', 'u-nabiha', 'feedback', 'Dr. Ahmed added feedback', 'Week 3 review: solid progress on the workspace UI.', iso(10, 9, 17, 15)),
    notif('n3', 'u-nabiha', 'task', 'You were assigned a new task', 'Implement Authentication — due Oct 15', iso(10, 8, 9, 30), true),
    notif('n4', 'u-nabiha', 'document', 'Ahmed updated the methodology', 'Version 5 saved at 9:58 AM', iso(10, 11, 9, 58)),
    notif('n5', 'u-nabiha', 'deadline', 'Your project deadline is approaching', 'Week 4 Real-Time Collaboration Demo is due Oct 15', iso(10, 11, 8)),
    notif('n6', 'u-sarah', 'comment', 'Nabiha replied to your comment', "Yes, I'll update the literature review.", iso(10, 11, 10, 44)),
    notif('n7', 'u-sarah', 'deadline', 'Task deadline tomorrow', 'Real-Time Notes Sync is due Oct 14', iso(10, 13, 8)),
  ];

  const file = (id: string, name: string, type: string, sizeBytes: number, version: number, uploadedById: string, createdAt: string) =>
    ({ id, projectId: 'p-sca', name, type, sizeBytes, version, uploadedById, storageKey: '', createdAt, updatedAt: createdAt });
  db.files = [
    file('f1', 'Final Report.pdf', 'application/pdf', 2_516_582, 2, 'u-nabiha', iso(10, 10, 16, 20)),
    file('f2', 'Project Proposal.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 486_201, 1, 'u-nabiha', iso(9, 9, 13)),
    file('f3', 'System Architecture.png', 'image/png', 1_104_906, 3, 'u-ahmed-ali', iso(10, 7, 15, 40)),
    file('f4', 'Literature Review.pdf', 'application/pdf', 812_340, 1, 'u-sarah', iso(10, 1, 18)),
    file('f5', 'Week 3 Demo Script.txt', 'text/plain', 4_212, 1, 'u-hassan', iso(10, 4, 12)),
  ];

  return db;
}

export async function seedIfEmpty(): Promise<void> {
  if (store.collection('users').length > 0) return;
  const data = await buildSeedData();
  store.reset(data);
  store.flush();
}
