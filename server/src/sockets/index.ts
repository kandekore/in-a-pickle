import type { Server as HttpServer } from 'node:http';
import { Server as IOServer, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { setIO } from './io.js';
import { recordProviderLocation } from '../services/tracking.service.js';
import type { Role } from '../models/User.js';

/**
 * Real-time layer. All live features run over Socket.IO:
 *   provider tracking, job status, chat, presence, dispatch.
 *
 * Rooms:
 *   user:<id>   — personal channel (notifications, dispatch offers)
 *   job:<id>    — everyone on a job (tracking + chat)
 *
 * TODO(platform): add the Redis adapter for horizontal scaling, and persist
 * chat/tracking via the existing models instead of broadcasting only.
 */
export function attachSockets(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: { origin: env.webOrigin, credentials: true },
  });
  setIO(io); // expose to routes/services that need to emit

  // Authenticate the socket from the JWT access token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Auth token required'));
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret) as { sub: string; role: Role };
      socket.data.userId = decoded.sub;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data as { userId: string; role: Role };
    socket.join(`user:${userId}`);
    logger.info('Socket connected', { userId, role });

    // Join a job room (customer or assigned provider).
    // TODO(sprint-next): authorise room membership server-side — currently any
    // authenticated socket may join any job:<id> room. Deferred by agreement.
    socket.on('job:join', (jobId: string) => {
      socket.join(`job:${jobId}`);
    });

    // Provider pushes a REAL GPS fix; the tracking service persists it to
    // Job.tracking, broadcasts to the job room, and auto-marks 'arrived' inside
    // the arrival radius. Expected cadence: settings.tracking.providerPingSeconds.
    socket.on(
      'tracking:update',
      (payload: {
        jobId: string;
        lng: number;
        lat: number;
        heading?: number | null;
        accuracy?: number | null;
      }) => {
        if (role !== 'provider') return; // only the assigned provider streams GPS
        void recordProviderLocation(payload.jobId, [payload.lng, payload.lat], {
          heading: payload.heading,
          accuracy: payload.accuracy,
        });
      },
    );

    // Job-scoped chat (only after payment unlocks it — enforced server-side TODO).
    socket.on('chat:message', (payload: { jobId: string; body: string }) => {
      io.to(`job:${payload.jobId}`).emit('chat:message', {
        jobId: payload.jobId,
        senderId: userId,
        body: payload.body,
        at: new Date().toISOString(),
      });
      // TODO(platform): persist ChatMessage + redact shared contact details.
    });

    // Provider toggles availability (instant dispatch presence).
    socket.on('provider:status', (online: boolean) => {
      logger.info('Provider status toggled', { userId, online });
      // TODO(platform): persist Provider.online + update presence index.
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId });
    });
  });

  return io;
}
