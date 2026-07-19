import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Best-effort coarse location from the caller's IP, used ONLY to pre-fill the
 * request form before the user grants precise geolocation. Never authoritative:
 * any failure (private IP, provider down, timeout) returns null and the UI
 * simply shows no pre-fill.
 *
 * Default provider is keyless ip-api.com (free, 45 req/min, server-side only).
 */

export interface CoarseLocation {
  label: string;
  coordinates: [number, number]; // [lng, lat]
}

export async function ipGeolocate(ip: string | null): Promise<CoarseLocation | null> {
  if (!ip || isPrivate(ip)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const url = `${env.ipGeoUrl}/${encodeURIComponent(ip)}?fields=status,lat,lon,city,regionName,country`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      status?: string;
      lat?: number;
      lon?: number;
      city?: string;
      regionName?: string;
      country?: string;
    };
    if (d.status !== 'success' || typeof d.lat !== 'number' || typeof d.lon !== 'number') {
      return null;
    }
    const label = [d.city, d.regionName, d.country].filter(Boolean).join(', ');
    return { label: label || 'Approximate location', coordinates: [d.lon, d.lat] };
  } catch (err) {
    logger.warn('IP geolocation failed', { message: (err as Error).message });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** RFC1918 / loopback / link-local — never worth a lookup (and leaks nothing). */
function isPrivate(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd') ||
    ip.startsWith('169.254.')
  );
}
