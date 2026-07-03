import { io, type Socket } from 'socket.io-client';
import { site } from './site';

/** Authenticated Socket.IO client (tracking, chat, presence, job status). */
export function createSocket(token: string): Socket {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? site.apiUrl;
  return io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export type TrackingUpdate = {
  jobId: string;
  lng: number;
  lat: number;
  etaSeconds: number;
  remainingMeters?: number;
  at: string;
};
