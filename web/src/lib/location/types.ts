/**
 * Location abstraction contract.
 *
 * Every part of the app talks to the map/routing provider ONLY through an
 * implementation of `ILocationService`. This is the seam that lets us swap the
 * underlying provider (OSM/ORS today, something else tomorrow) and reuse the
 * same code in a future React Native app by providing a native implementation.
 */

export type LngLat = [number, number]; // [lng, lat]

export interface GeoPosition {
  coords: LngLat;
  accuracy?: number | null; // metres
  heading?: number | null; // degrees, 0 = north
  at: number; // epoch ms
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  geometry: LngLat[]; // polyline, ready for a GeoJSON LineString
}

export interface TrackingConfig {
  gpsUpdateIntervalSeconds: number;
  providerPingSeconds: number;
  routeRefreshSeconds: number;
  arrivalRadiusMeters: number;
  mapStyleUrl: string;
}

export interface WatchOptions {
  enableHighAccuracy?: boolean;
}

export interface AddressSuggestion {
  label: string;
  coordinates: LngLat; // [lng, lat]
}

export interface CoarseLocation {
  label: string;
  coordinates: LngLat; // [lng, lat]
}

export interface ILocationService {
  /** One-shot current position (prompts for permission). */
  getCurrentPosition(opts?: WatchOptions): Promise<GeoPosition>;
  /** Continuously watch position; returns a watch id for clearWatch(). */
  watchPosition(
    onUpdate: (pos: GeoPosition) => void,
    onError?: (err: GeoLocationError) => void,
    opts?: WatchOptions,
  ): number;
  /** Stop a watch started with watchPosition(). */
  clearWatch(id: number): void;
  /** Driving route between two points (via the backend ORS proxy). */
  getRoute(from: LngLat, to: LngLat): Promise<RouteResult | null>;
  /** Human-readable label for a coordinate (via the backend ORS proxy). */
  reverseGeocode(point: LngLat): Promise<string | null>;
  /** Predictive address search (via the backend ORS proxy), optionally biased near `focus`. */
  autocomplete(text: string, focus?: LngLat | null): Promise<AddressSuggestion[]>;
  /** Coarse IP-based location to pre-fill forms — best-effort, may be null. */
  ipLocate(): Promise<CoarseLocation | null>;
  /** Client-safe runtime config (map style + tracking cadences). */
  getConfig(): Promise<TrackingConfig>;
}

export interface GeoLocationError {
  code: number;
  message: string;
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  gpsUpdateIntervalSeconds: 45,
  providerPingSeconds: 5,
  routeRefreshSeconds: 15,
  arrivalRadiusMeters: 100,
  mapStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
};
