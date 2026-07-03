import { env } from '../config/env.js';
import { HttpError } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * OpenRouteService client. All routing / geocoding goes through here so the
 * ORS key stays server-side and the same backend can serve web + React Native.
 * Routes are never computed manually — ORS returns distance, duration and the
 * polyline geometry.
 */

type LngLat = [number, number];

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: LngLat[]; // [lng, lat][] — ready for a GeoJSON LineString
}

function ensureConfigured() {
  if (!env.ors.apiKey) {
    throw new HttpError(503, 'Routing is not configured. Set ORS_API_KEY to enable ORS routing.');
  }
}

/** Driving directions between two points. */
export async function getDirections(from: LngLat, to: LngLat): Promise<RouteResult> {
  ensureConfigured();
  const url = `${env.ors.baseUrl}/v2/directions/driving-car/geojson`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: env.ors.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates: [from, to] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.warn('ORS directions failed', { status: res.status, body: body.slice(0, 300) });
    throw new HttpError(502, 'Routing provider error.');
  }

  const data = (await res.json()) as {
    features?: {
      geometry?: { coordinates?: LngLat[] };
      properties?: { summary?: { distance?: number; duration?: number } };
    }[];
  };
  const feature = data.features?.[0];
  const summary = feature?.properties?.summary;
  return {
    distanceMeters: Math.round(summary?.distance ?? 0),
    durationSeconds: Math.round(summary?.duration ?? 0),
    geometry: feature?.geometry?.coordinates ?? [],
  };
}

/** Human-readable label for a coordinate (ORS / Pelias reverse geocode). */
export async function reverseGeocode([lng, lat]: LngLat): Promise<string | null> {
  ensureConfigured();
  const url = `${env.ors.baseUrl}/geocode/reverse?api_key=${env.ors.apiKey}&point.lon=${lng}&point.lat=${lat}&size=1`;
  const res = await fetch(url);
  if (!res.ok) {
    logger.warn('ORS reverse geocode failed', { status: res.status });
    throw new HttpError(502, 'Geocoding provider error.');
  }
  const data = (await res.json()) as { features?: { properties?: { label?: string } }[] };
  return data.features?.[0]?.properties?.label ?? null;
}
