import { site } from '../site';
import {
  DEFAULT_TRACKING_CONFIG,
  type AddressSuggestion,
  type CoarseLocation,
  type GeoLocationError,
  type GeoPosition,
  type ILocationService,
  type LngLat,
  type RouteResult,
  type TrackingConfig,
  type WatchOptions,
} from './types';

/**
 * Browser implementation of the location abstraction.
 *
 * - Geolocation → the W3C Geolocation API.
 * - Routing / reverse geocoding → our own backend proxy (which holds the ORS
 *   key). Components never call ORS or MapLibre directly.
 *
 * A React Native app would provide its own ILocationService (e.g. wrapping
 * expo-location) and hit the SAME backend endpoints — no backend changes.
 */
class BrowserLocationService implements ILocationService {
  private configPromise: Promise<TrackingConfig> | null = null;

  private token(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('iap_access_token') : null;
  }

  getCurrentPosition(opts: WatchOptions = {}): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject({ code: -1, message: 'Geolocation is not available in this environment.' } as GeoLocationError);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(toGeoPosition(p)),
        (e) => reject({ code: e.code, message: e.message } as GeoLocationError),
        { enableHighAccuracy: opts.enableHighAccuracy ?? true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  watchPosition(
    onUpdate: (pos: GeoPosition) => void,
    onError?: (err: GeoLocationError) => void,
    opts: WatchOptions = {},
  ): number {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.({ code: -1, message: 'Geolocation is not available in this environment.' });
      return -1;
    }
    return navigator.geolocation.watchPosition(
      (p) => onUpdate(toGeoPosition(p)),
      (e) => onError?.({ code: e.code, message: e.message }),
      { enableHighAccuracy: opts.enableHighAccuracy ?? true, timeout: 20000, maximumAge: 2000 },
    );
  }

  clearWatch(id: number): void {
    if (id >= 0 && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(id);
    }
  }

  async getRoute(from: LngLat, to: LngLat): Promise<RouteResult | null> {
    try {
      const res = await fetch(`${site.apiUrl}/api/routing/directions`, {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: JSON.stringify({ from, to }),
      });
      if (!res.ok) return null; // e.g. 503 when ORS_API_KEY is not configured
      return (await res.json()) as RouteResult;
    } catch {
      return null;
    }
  }

  async reverseGeocode(point: LngLat): Promise<string | null> {
    try {
      const res = await fetch(`${site.apiUrl}/api/geo/reverse`, {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: JSON.stringify({ point }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { label?: string | null };
      return data.label ?? null;
    } catch {
      return null;
    }
  }

  async autocomplete(text: string, focus?: LngLat | null): Promise<AddressSuggestion[]> {
    const q = text.trim();
    if (q.length < 3) return [];
    try {
      const params = new URLSearchParams({ text: q });
      if (focus) {
        params.set('lon', String(focus[0]));
        params.set('lat', String(focus[1]));
      }
      const res = await fetch(`${site.apiUrl}/api/geo/autocomplete?${params.toString()}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { suggestions?: AddressSuggestion[] };
      return data.suggestions ?? [];
    } catch {
      return [];
    }
  }

  async ipLocate(): Promise<CoarseLocation | null> {
    try {
      const res = await fetch(`${site.apiUrl}/api/geo/ip`);
      if (!res.ok) return null;
      const data = (await res.json()) as { label?: string | null; coordinates?: LngLat | null };
      if (!data.coordinates || !data.label) return null;
      return { label: data.label, coordinates: data.coordinates };
    } catch {
      return null;
    }
  }

  getConfig(): Promise<TrackingConfig> {
    if (!this.configPromise) {
      this.configPromise = fetch(`${site.apiUrl}/api/config`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('config failed'))))
        .then((d: { tracking?: Partial<TrackingConfig>; map?: { styleUrl?: string } }) => ({
          ...DEFAULT_TRACKING_CONFIG,
          ...d.tracking,
          mapStyleUrl: d.map?.styleUrl ?? DEFAULT_TRACKING_CONFIG.mapStyleUrl,
        }))
        .catch(() => DEFAULT_TRACKING_CONFIG);
    }
    return this.configPromise;
  }

  private jsonHeaders(): Record<string, string> {
    const token = this.token();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}

function toGeoPosition(p: GeolocationPosition): GeoPosition {
  return {
    coords: [p.coords.longitude, p.coords.latitude],
    accuracy: p.coords.accuracy ?? null,
    heading: Number.isFinite(p.coords.heading) ? p.coords.heading : null,
    at: p.timestamp,
  };
}

/** Singleton the whole web app shares. */
export const locationService: ILocationService = new BrowserLocationService();
