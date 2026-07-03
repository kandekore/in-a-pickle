import { createServer } from 'node:http';
import { createApp } from './app.js';
import { attachSockets } from './sockets/index.js';
import { connectDb } from './db/connect.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb(); // degrades gracefully if Mongo is unavailable

  const app = createApp();
  const httpServer = createServer(app);
  attachSockets(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`In a Pickle API listening on :${env.port}`, {
      env: env.nodeEnv,
      webOrigin: env.webOrigin,
    });
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: (err as Error).message });
  process.exit(1);
});
