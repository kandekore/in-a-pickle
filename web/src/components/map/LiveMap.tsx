'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { locationService } from '@/lib/location/LocationService';
import type { LngLat } from '@/lib/location/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LiveMapProps {
  customer?: LngLat | null;
  provider?: LngLat | null;
  providerAccuracy?: number | null;
  providerHeading?: number | null;
  route?: LngLat[] | null;
  /** Override the configured style (otherwise pulled from /api/config). */
  styleUrl?: string;
  /** Fit the viewport to the customer + provider points on each update. */
  fitToPoints?: boolean;
  className?: string;
}

const FOREST = '#1b5e20';
const PRIMARY = '#4caf50';

/**
 * The ONLY component that imports MapLibre GL. Renders customer / provider
 * markers, an accuracy circle, a heading arrow and a route polyline from props,
 * over an OpenStreetMap (MapLibre) style. MapLibre is imported dynamically so it
 * never runs during SSR. Written prop-driven and layout-agnostic so it can be
 * reused inside a React Native map wrapper later.
 */
export default function LiveMap({
  customer,
  provider,
  providerAccuracy,
  providerHeading,
  route,
  styleUrl,
  fitToPoints = true,
  className = 'h-[420px] w-full rounded-2xl border border-trim',
}: LiveMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const glRef = useRef<any>(null);
  const customerMarker = useRef<any>(null);
  const providerMarker = useRef<any>(null);
  const providerArrow = useRef<HTMLSpanElement | null>(null);
  const readyRef = useRef(false);
  const [failed, setFailed] = useState(false);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const style = styleUrl ?? (await locationService.getConfig()).mapStyleUrl;
        const maplibregl = (await import('maplibre-gl')).default;
        if (cancelled || !container.current || mapRef.current) return;
        glRef.current = maplibregl;

        const map = new maplibregl.Map({
          container: container.current,
          style,
          center: customer ?? provider ?? [-0.1276, 51.5072],
          zoom: 12,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          // Accuracy circle (below markers)
          map.addSource('accuracy', { type: 'geojson', data: emptyFC() });
          map.addLayer({
            id: 'accuracy-fill',
            type: 'fill',
            source: 'accuracy',
            paint: { 'fill-color': PRIMARY, 'fill-opacity': 0.12 },
          });
          map.addLayer({
            id: 'accuracy-line',
            type: 'line',
            source: 'accuracy',
            paint: { 'line-color': PRIMARY, 'line-opacity': 0.4, 'line-width': 1 },
          });
          // Route line
          map.addSource('route', { type: 'geojson', data: emptyFC() });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': FOREST, 'line-width': 4, 'line-opacity': 0.85 },
          });
          readyRef.current = true;
          syncOverlays();
          syncMarkers();
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      readyRef.current = false;
      try {
        mapRef.current?.remove();
      } catch {
        /* noop */
      }
      mapRef.current = null;
      customerMarker.current = null;
      providerMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep markers + overlays in sync with props.
  useEffect(() => {
    syncMarkers();
    syncOverlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customer?.[0],
    customer?.[1],
    provider?.[0],
    provider?.[1],
    providerAccuracy,
    providerHeading,
    route,
  ]);

  function syncMarkers() {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;

    if (customer) {
      if (!customerMarker.current) {
        customerMarker.current = new gl.Marker({ color: FOREST }).setLngLat(customer).addTo(map);
      } else {
        customerMarker.current.setLngLat(customer);
      }
    }

    if (provider) {
      if (!providerMarker.current) {
        const el = document.createElement('div');
        el.className = 'iap-provider-marker';
        const arrow = document.createElement('span');
        providerArrow.current = arrow;
        arrow.innerHTML = markerSvg();
        el.appendChild(arrow);
        providerMarker.current = new gl.Marker({ element: el }).setLngLat(provider).addTo(map);
      } else {
        providerMarker.current.setLngLat(provider);
      }
      if (providerArrow.current) {
        providerArrow.current.style.transform =
          providerHeading != null ? `rotate(${providerHeading}deg)` : 'none';
      }
    }

    if (fitToPoints) fit();
  }

  function syncOverlays() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const accuracySrc = map.getSource('accuracy');
    if (accuracySrc) {
      accuracySrc.setData(
        provider && providerAccuracy && providerAccuracy > 0
          ? circlePolygon(provider, providerAccuracy)
          : emptyFC(),
      );
    }
    const routeSrc = map.getSource('route');
    if (routeSrc) {
      routeSrc.setData(
        route && route.length > 1 ? lineString(route) : emptyFC(),
      );
    }
  }

  function fit() {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;
    const pts = [customer, provider].filter(Boolean) as LngLat[];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.easeTo({ center: pts[0], duration: 500 });
      return;
    }
    const bounds = new gl.LngLatBounds();
    pts.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 600 });
  }

  if (failed) return <MapFallback customer={customer} provider={provider} className={className} />;
  return <div ref={container} className={className} />;
}

/* ---- GeoJSON helpers (geometry only — routing itself is done by ORS) ------ */

function emptyFC() {
  return { type: 'FeatureCollection', features: [] } as any;
}

function lineString(coords: LngLat[]) {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {},
  } as any;
}

/** Approximate a geodesic circle as a polygon for the accuracy halo. */
function circlePolygon([lng, lat]: LngLat, radiusMeters: number, steps = 64) {
  const coords: LngLat[] = [];
  const dLat = radiusMeters / 111320;
  const dLng = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  } as any;
}

function markerSvg() {
  // Upward arrow inside a filled pin; rotation is applied by heading.
  return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#4caf50" stroke="white" stroke-width="2"/>
    <path d="M12 6l4 8-4-2-4 2 4-8z" fill="white"/>
  </svg>`;
}

/** Degraded fallback if MapLibre or the tile style fails to load. */
function MapFallback({
  customer,
  provider,
  className,
}: {
  customer?: LngLat | null;
  provider?: LngLat | null;
  className: string;
}) {
  return (
    <div className={`grid place-items-center bg-mint-50 text-center ${className}`}>
      <div className="px-6 text-sm text-ink/70">
        <p className="font-semibold text-forest">Live map unavailable</p>
        <p className="mt-1">
          {provider
            ? 'Provider location is live over WebSocket; the map tiles could not load.'
            : 'Waiting for the provider to start sharing their location.'}
        </p>
        {customer && (
          <p className="mt-2 text-xs text-ink/50">
            You: {customer[1].toFixed(4)}, {customer[0].toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
