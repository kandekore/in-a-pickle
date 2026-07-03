# ADR 0001 — Live Provider Tracking & Production Mapping

**Status:** Accepted · **Sprint:** 1 · **Date:** 2026-07-03

## Context

The platform shipped with a **simulated** tracking feed (`tracking.service.ts`
interpolated the provider toward the customer). We needed real, production-ready
provider tracking using browser geolocation, real routing/ETA, and live maps on
the customer, provider and admin surfaces — while preserving the existing
Express + REST + Socket.IO + Mongoose architecture and keeping the door open for
a future React Native app that reuses the same backend unchanged.

## Decisions

1. **`LocationService` is the single client seam.** All geolocation, routing,
   ETA, reverse geocoding and runtime config go through
   `web/src/lib/location/LocationService.ts` (an `ILocationService`
   implementation). No React component imports MapLibre or calls a map/routing
   provider directly. Only `LiveMap` renders MapLibre. This is what lets a React
   Native app drop in a native implementation and reuse everything else.

2. **Routing/geocoding is proxied server-side (ORS).** `LocationService` calls
   our own `POST /api/routing/directions` and `/api/geo/reverse`, which call
   OpenRouteService with a server-held `ORS_API_KEY`. The key never reaches the
   browser, and the same endpoints serve web + React Native. Routes are never
   computed manually — ORS returns distance, duration and polyline geometry.

3. **Real GPS flows over the *existing* Socket.IO event.** The provider app
   transmits `tracking:update {jobId,lng,lat,heading,accuracy}` every
   `providerPingSeconds` (5s). The socket layer calls the **extended**
   `tracking.service.recordProviderLocation()`, which persists `Job.tracking`,
   re-broadcasts to the `job:<id>` room, and auto-marks `arrived` inside the
   arrival radius — the same rooms, payload and arrival rule the simulator used.
   No new transport, no duplicate tracking system.

4. **The simulator is retained but disabled by default.** `startTrackingSim()`
   stays in the tracking service, gated behind `TRACKING_SIMULATOR=true`
   (env flag, off by default). Real GPS is the production path; the simulator is
   opt-in for hands-free demos/tests.

5. **Two-tier ETA to respect ORS rate limits.** The server stores a cheap
   straight-line ETA (`assumedSpeedMps`) on every fix so list views/initial
   loads always have a value. The accurate ORS route + ETA is computed
   client-side by `useLiveRoute`, only while a map is open, throttled to
   `routeRefreshSeconds`.

6. **MapLibre GL + OpenStreetMap replaces Mapbox.** Removes the token
   requirement. `MAP_STYLE_URL` is configurable via `GET /api/config` and
   defaults to the free MapLibre demo style for dev; production should point at a
   keyed provider (MapTiler/Stadia) — OSM raw tiles are not for production use.
   `TrackingMap`'s public props (`customer`, `provider`) were preserved.

7. **Nothing hardcoded.** GPS ping interval, route refresh interval, arrival
   radius, assumed speed, map style URL, ORS key/base and the simulator flag are
   all configuration (`settings.ts` / `env.ts`), surfaced to clients via
   `/api/config`.

## Consequences

- The auto-animating one-click demo is gone unless `TRACKING_SIMULATOR=true`;
  live movement now needs a real provider session sending GPS.
- Geolocation requires HTTPS in production (localhost is fine in dev).
- Accurate routing needs `ORS_API_KEY`; without it, maps + live tracking still
  work and ETA falls back to the server's straight-line estimate.

## Deferred (future sprints)

- **Socket room authorisation.** `job:join` still lets any authenticated socket
  join any `job:<id>` room. Flagged with a `TODO(sprint-next)` in
  `sockets/index.ts`; deferred by agreement.
- Tracking history/playback, geofencing, and a Redis Socket.IO adapter for
  horizontal scale.
