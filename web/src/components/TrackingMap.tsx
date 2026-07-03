'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';

type LngLat = [number, number];

interface Props {
  customer: LngLat; // [lng, lat]
  provider: LngLat | null;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Live tracking map. Uses Mapbox GL when NEXT_PUBLIC_MAPBOX_TOKEN is set;
 * otherwise renders an accessible schematic fallback so the feature is fully
 * usable without credentials (add a token to switch to the real map).
 */
export default function TrackingMap({ customer, provider }: Props) {
  if (!TOKEN) return <SchematicFallback customer={customer} provider={provider} />;
  return <MapboxMap customer={customer} provider={provider} />;
}

function MapboxMap({ customer, provider }: Props) {
  const container = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providerMarker = useRef<any>(null);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled || !container.current || mapRef.current) return;
      mapboxgl.accessToken = TOKEN as string;

      const map = new mapboxgl.Map({
        container: container.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: customer,
        zoom: 12,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      mapRef.current = map;

      // Customer marker (forest green)
      new mapboxgl.Marker({ color: '#1b5e20' }).setLngLat(customer).setPopup(new mapboxgl.Popup().setText('You')).addTo(map);

      // Provider marker (bright primary) — created/updated as data arrives
      if (provider) {
        providerMarker.current = new mapboxgl.Marker({ color: '#4caf50' }).setLngLat(provider).addTo(map);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the provider marker + keep both in view on each update.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !provider) return;
    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (!providerMarker.current) {
        providerMarker.current = new mapboxgl.Marker({ color: '#4caf50' }).setLngLat(provider).addTo(map);
      } else {
        providerMarker.current.setLngLat(provider);
      }
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(customer);
      bounds.extend(provider);
      map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 600 });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.[0], provider?.[1]]);

  return <div ref={container} className="h-[420px] w-full rounded-2xl border border-trim" />;
}

/** No-token fallback: a clear schematic showing relative positions. */
function SchematicFallback({ customer, provider }: Props) {
  // Normalise the two points into a padded 0–1 box for display.
  const pts = provider ? [customer, provider] : [customer];
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const norm = ([lng, lat]: LngLat): { x: number; y: number } => ({
    x: 10 + 80 * (maxLng === minLng ? 0.5 : (lng - minLng) / (maxLng - minLng)),
    y: 90 - 80 * (maxLat === minLat ? 0.5 : (lat - minLat) / (maxLat - minLat)),
  });
  const c = norm(customer);
  const p = provider ? norm(provider) : null;

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-trim bg-mint-50">
      <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label="Schematic map of provider and customer positions">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="#cdebd3" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        {p && <line x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke="#2e7d32" strokeWidth="0.8" strokeDasharray="2 2" />}
        <g>
          <circle cx={c.x} cy={c.y} r="2.6" fill="#1b5e20" />
          <text x={c.x} y={c.y - 4} fontSize="3.5" textAnchor="middle" fill="#1b5e20">You</text>
        </g>
        {p && (
          <g>
            <circle cx={p.x} cy={p.y} r="2.6" fill="#4caf50" />
            <text x={p.x} y={p.y - 4} fontSize="3.5" textAnchor="middle" fill="#2e7d32">Provider</text>
          </g>
        )}
      </svg>
      <p className="absolute bottom-2 left-2 right-2 rounded-lg bg-white/85 px-3 py-2 text-xs text-ink/70">
        Live schematic. Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to render the full Mapbox street map — positions and updates are already live over WebSocket.
      </p>
    </div>
  );
}
