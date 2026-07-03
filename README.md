# In a Pickle Breakdown

> _"Here to Help When Your Motor's in a Pickle"_

Pay-as-you-need breakdown & recovery marketplace. Drivers request on-demand
roadside assistance or recovery and pay only when they need it; independent
mechanics and recovery operators receive real jobs and keep their earnings
(5% commission on the call-out/recovery fee only).

This repo is a **monorepo**:

| Workspace | Stack | Purpose |
|-----------|-------|---------|
| [`web/`](./web) | Next.js (App Router) + TypeScript + Tailwind + Mapbox | Marketing site (SEO) **and** the customer/provider PWA |
| [`server/`](./server) | Node + Express + Socket.IO + MongoDB (Mongoose) + Stripe Connect | REST + WebSocket API, designed to also serve a future React Native app |

## Why this architecture

The brief's `build_target.platform` asks for **Next.js + Mapbox**, while the
`additional_instructions` specify a **MERN** stack with a standalone API that
can later feed a React Native mobile app. The monorepo honours both: Next.js
gives first-class SEO for the marketing pages and a PWA shell for the app,
while the Express + Socket.IO API stays framework-agnostic and mobile-ready.

## Quick start

```bash
# 1. install (npm workspaces)
npm install

# 2. configure env
cp .env.example .env
cp .env.example web/.env.local
cp .env.example server/.env
#   then fill in Mongo URI, JWT secrets, Stripe + Mapbox tokens

# 3. run Mongo (locally or via docker)
docker compose up -d mongo

# 4. run both apps (web :3000, api :4000)
npm run dev
```

- Web: http://localhost:3000
- API health: http://localhost:4000/health

Or run the whole stack in containers: `docker compose up --build`.

## Build status (current session — thin end-to-end slice)

**Done**

- Monorepo + Docker + env scaffolding
- Brand theme (light pastel green / forest-green text) from `brand_colours`,
  tuned for colour-blind / dyslexia legibility per the brief
- Shared Header + Footer, logo, mobile nav
- All 8 marketing pages with brief content + per-page SEO metadata
- Product catalogue (Roadside £50 / Recovery £80 / Unsure £100) + detail pages
- `sitemap.xml`, `robots.txt`, JSON-LD `LocalBusiness` schema, OG/Twitter meta
- Express API: config-driven settings, Mongoose models, JWT/RBAC auth
- End-to-end **job-request slice**: create job → fixed-price quote →
  Stripe payment-intent stub → nearest-provider dispatch stub → Socket.IO
  tracking + chat skeleton, with a `/request-help` page wired to the API

**Stubbed / next milestones** (flagged in code with `// TODO(platform)`):

- Stripe Connect onboarding, escrow release, commission payout, refunds
- OCR document verification + expiry suspension
- Admin dashboard (live jobs, disputes, compliance, templates)
- SMS / email / push notification delivery
- Geospatial dispatch tuning + real Mapbox Directions ETA
- Redis adapter for Socket.IO horizontal scaling

## Configurable business rules

Per the brief, thresholds are **settings, not constants** — see
[`server/src/config/settings.ts`](./server/src/config/settings.ts):
commission %, arrival radius, GPS interval, escrow hold, cancellation penalty,
recovery mileage allowance, assistance window, etc.

## Layout

```
web/     Next.js app (marketing + app shell)
server/  Express API (REST + Socket.IO)
docker-compose.yml
.env.example
```
