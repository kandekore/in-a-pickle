'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket } from '@/lib/socket';
import { locationService } from '@/lib/location/LocationService';
import type { GeoPosition } from '@/lib/location/types';

/**
 * Provider-side live tracking.
 *
 * When `enabled` (the provider is Online), watches the device position and — on
 * a fixed cadence (settings.tracking.providerPingSeconds) — transmits the latest
 * fix over the existing Socket.IO `tracking:update` event for the currently
 * active en-route job. Reused unchanged by a future React Native provider app
 * by swapping the LocationService implementation.
 */
export function useProviderTracking(enabled: boolean, activeJobId: string | null) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<number>(-1);
  const latest = useRef<GeoPosition | null>(null);
  const jobRef = useRef<string | null>(activeJobId);

  // Keep the active job id current without restarting the watch/socket.
  useEffect(() => {
    jobRef.current = activeJobId;
  }, [activeJobId]);

  useEffect(() => {
    if (!enabled) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('iap_access_token') : null;
    if (!token) return;

    let cancelled = false;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    setError(null);
    watchRef.current = locationService.watchPosition(
      (p) => {
        latest.current = p;
        if (!cancelled) setPosition(p);
      },
      (e) => !cancelled && setError(e.message),
    );

    const socket = createSocket(token);
    socketRef.current = socket;

    locationService.getConfig().then((cfg) => {
      if (cancelled) return;
      const emit = () => {
        const pos = latest.current;
        const jobId = jobRef.current;
        if (pos && jobId && socketRef.current?.connected) {
          socketRef.current.emit('tracking:update', {
            jobId,
            lng: pos.coords[0],
            lat: pos.coords[1],
            heading: pos.heading ?? null,
            accuracy: pos.accuracy ?? null,
          });
        }
      };
      pingTimer = setInterval(emit, (cfg.providerPingSeconds || 5) * 1000);
    });

    return () => {
      cancelled = true;
      if (watchRef.current >= 0) locationService.clearWatch(watchRef.current);
      watchRef.current = -1;
      if (pingTimer) clearInterval(pingTimer);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return { position, error };
}
