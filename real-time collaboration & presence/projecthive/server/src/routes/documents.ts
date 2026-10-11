import { Router } from 'express';
import { store } from '../db/store.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/access.js';
import { saveDocumentSchema } from '../validation/schemas.js';
import { parseBody, prm } from '../utils/http.js';
import { userName } from '../utils/activity.js';
import { getIO, logActivity, roomOf } from '../sockets/index.js';
import { SOCKET_EVENTS, type DocumentUpdatedEvent } from '../sockets/events.js';
import type { CollaborativeDocument, DocumentVersion, ResearchSection } from '../types.js';

export const documentsRouter = Router({ mergeParams: true });
documentsRouter.use(requireAuth, requireProjectAccess);

// GET /api/projects/:projectId/documents
documentsRouter.get('/', (req, res) => {
  const docs = store.filter('collaborativeDocuments', (d: CollaborativeDocument) => d.projectId === prm(req, 'projectId'));
  res.json({ documents: docs });
});

// GET /api/projects/:projectId/documents/:documentId
documentsRouter.get('/:documentId', (req, res) => {
  const doc = store.find(
    'collaborativeDocuments',
    (d: CollaborativeDocument) => d.id === prm(req, 'documentId') && d.projectId === prm(req, 'projectId'),
  );
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json({ document: doc });
});

// POST /api/projects/:projectId/documents/:documentId/save
// REST fallback with the same optimistic concurrency control as the socket path.
documentsRouter.post('/:documentId/save', (req: AuthedRequest, res) => {
  const input = parseBody(saveDocumentSchema, req, res);
  if (!input) return;
  const projectId = prm(req, 'projectId');
  const doc = store.find(
    'collaborativeDocuments',
    (d: CollaborativeDocument) => d.id === prm(req, 'documentId') && d.projectId === projectId,
  );
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  if (input.baseVersion !== doc.version) {
    res.status(409).json({
      error: 'Version conflict',
      yourVersion: input.baseVersion,
      serverVersion: doc.version,
      serverContent: doc.content,
      serverUpdatedBy: doc.updatedBy,
      serverUpdatedAt: doc.updatedAt,
    });
    return;
  }
  store.insert('documentVersions', {
    documentId: doc.id,
    version: doc.version,
    content: doc.content,
    savedBy: req.user!.id,
    createdAt: doc.updatedAt,
  } as Omit<DocumentVersion, 'id'>);
  doc.content = input.content;
  doc.version += 1;
  doc.updatedBy = req.user!.id;
  doc.updatedAt = new Date().toISOString();
  store.flush();

  const event: DocumentUpdatedEvent = {
    projectId,
    documentId: doc.id,
    content: doc.content,
    version: doc.version,
    updatedBy: doc.updatedBy,
    updatedByName: userName(doc.updatedBy),
    updatedAt: doc.updatedAt,
  };
  getIO()?.to(roomOf(projectId)).emit(SOCKET_EVENTS.DOCUMENT_UPDATED, event);
  logActivity(projectId, req.user!.id, 'document.update', `${userName(req.user!.id)} updated ${doc.title}`);
  res.json({ document: doc });
});

// GET /api/projects/:projectId/documents/:documentId/versions
documentsRouter.get('/:documentId/versions', (req, res) => {
  const versions = store
    .filter('documentVersions', (v: DocumentVersion) => v.documentId === prm(req, 'documentId'))
    .sort((a, b) => b.version - a.version)
    .slice(0, 30)
    .map((v) => ({ ...v, savedByName: userName(v.savedBy) }));
  res.json({ versions });
});

// GET /api/projects/:projectId/documents/research/sections
export const researchRouter = Router({ mergeParams: true });
researchRouter.use(requireAuth, requireProjectAccess);

researchRouter.get('/sections', (req, res) => {
  const projectId = prm(req, 'projectId');
  const sections = store
    .filter('researchSections', (s: ResearchSection) => s.projectId === projectId)
    .map((s) => {
      const doc = store.find('collaborativeDocuments', (d: CollaborativeDocument) => d.id === s.documentId);
      return { ...s, document: doc ?? null };
    });
  res.json({ sections });
});
