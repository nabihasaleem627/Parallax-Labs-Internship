import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { store } from './db/store.js';
import { seedIfEmpty } from './db/seed.js';
import { setupSockets } from './sockets/index.js';
import { errorHandler, notFound } from './utils/http.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';
import { documentsRouter, researchRouter } from './routes/documents.js';
import { activityRouter, commentsRouter, filesRouter, meetingsRouter, notificationsRouter } from './routes/collab.js';

export async function createServer() {
  store.load();
  await seedIfEmpty();

  const app = express();
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'projecthive-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:projectId/tasks', tasksRouter);
  app.use('/api/projects/:projectId/documents', documentsRouter);
  app.use('/api/projects/:projectId/research', researchRouter);
  app.use('/api/projects/:projectId/comments', commentsRouter);
  app.use('/api/projects/:projectId/meetings', meetingsRouter);
  app.use('/api/projects/:projectId/files', filesRouter);
  app.use('/api/projects/:projectId/activities', activityRouter);

  app.use(notFound);
  app.use(errorHandler);

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: config.clientOrigin, credentials: true },
    pingTimeout: 20000,
    pingInterval: 10000,
  });
  setupSockets(io);

  process.on('SIGINT', () => {
    store.flush();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    store.flush();
    process.exit(0);
  });

  return { app, httpServer, io };
}
