import { config } from './config.js';
import { createServer } from './app.js';

const { httpServer } = await createServer();

httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(`[projecthive] API + Socket.io listening on http://0.0.0.0:${config.port}`);
});
