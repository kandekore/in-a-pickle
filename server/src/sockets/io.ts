import type { Server as IOServer } from 'socket.io';

/**
 * Holds the live Socket.IO instance so non-socket code (routes, services) can
 * emit to job/user rooms. Set once during startup in attachSockets().
 */
let io: IOServer | null = null;

export function setIO(instance: IOServer) {
  io = instance;
}

export function getIO(): IOServer | null {
  return io;
}
