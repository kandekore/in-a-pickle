'use client';

import { useEffect, useRef, useState } from 'react';
import { locationService } from '@/lib/location/LocationService';
import type { LngLat, RouteResult } from '@/lib/location/types';

/**
 * Fetches the driving route between two points via LocationService (ORS proxy)
 * and refreshes it at most every `routeRefreshSeconds` as the points change.
 * Returns null when routing is unavailable (e.g. ORS key not configured) —
 * callers fall back to the server's straight-line ETA. Shared by the customer,
 * provider and admin live maps.
 */
export function useLiveRoute(from: LngLat | null | undefined, to: LngLat | null | undefined) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const lastAt = useRef(0);
  const refreshMs = useRef(15000);

  useEffect(() => {
    locationService.getConfig().then((c) => {
      refreshMs.current = (c.routeRefreshSeconds || 15) * 1000;
    });
  }, []);

  useEffect(() => {
    if (!from || !to) {
      setRoute(null);
      return;
    }
    const now = Date.now();
    if (route && now - lastAt.current < refreshMs.current) return; // throttle
    lastAt.current = now;
    let cancelled = false;
    locationService.getRoute(from, to).then((r) => {
      if (!cancelled && r) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.[0], from?.[1], to?.[0], to?.[1]]);

  return route;
}
