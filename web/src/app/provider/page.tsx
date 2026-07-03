'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import LiveMap from '@/components/map/LiveMap';
import { useProviderTracking } from '@/components/map/useProviderTracking';
import { useLiveRoute } from '@/components/map/useLiveRoute';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIVE_STATUSES = ['accepted', 'en_route', 'arrived', 'in_progress'];
const NEXT_LABEL: Record<string, string> = {
  accepted: 'Start travelling',
  en_route: 'Mark arrived',
  arrived: 'Begin assessment',
  in_progress: 'Complete job',
};

function fmtEta(seconds?: number | null): string {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  return m >= 1 ? `${m} min` : 'Arriving';
}

export default function ProviderPage() {
  const { user, loading, logout, authedFetch } = useAuth();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [available, setAvailable] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [offline, setOffline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Guard — providers only.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/provider');
    else if (user.role !== 'provider') router.replace('/');
  }, [loading, user, router]);

  const loadMe = useCallback(() => {
    authedFetch('/api/provider/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d))
      .catch(() => undefined);
  }, [authedFetch]);

  const loadAvailable = useCallback(() => {
    authedFetch('/api/provider/jobs/available')
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => {
        setAvailable(d.jobs ?? []);
        setOffline(Boolean(d.offline));
      })
      .catch(() => undefined);
  }, [authedFetch]);

  const loadMine = useCallback(() => {
    authedFetch('/api/provider/jobs/mine')
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => setMine(d.jobs ?? []))
      .catch(() => undefined);
  }, [authedFetch]);

  // Initial load + poll the incoming feed every 8s (live dispatch feel).
  useEffect(() => {
    if (user?.role !== 'provider') return;
    loadMe();
    loadAvailable();
    loadMine();
    const id = setInterval(() => {
      loadAvailable();
      loadMine();
    }, 8000);
    return () => clearInterval(id);
  }, [user, loadMe, loadAvailable, loadMine]);

  async function toggleOnline(next: boolean) {
    setToggling(true);
    await authedFetch('/api/provider/status', { method: 'PATCH', body: JSON.stringify({ online: next }) });
    setToggling(false);
    loadMe();
    loadAvailable();
  }

  async function accept(jobId: string) {
    const res = await authedFetch(`/api/provider/jobs/${jobId}/accept`, { method: 'POST' });
    if (res.ok) {
      setNote('Job accepted — customer location revealed below.');
    } else {
      const err = await res.json().catch(() => ({}));
      setNote(err.error ?? 'Could not accept this job.');
    }
    loadAvailable();
    loadMine();
    loadMe();
  }

  async function advance(jobId: string) {
    await authedFetch(`/api/provider/jobs/${jobId}/advance`, { method: 'POST' });
    loadMine();
    loadMe();
  }

  // Derived state + live-tracking hooks — declared before any early return so
  // hook order stays stable across renders.
  const online = Boolean(me?.provider?.online);
  const enRouteJob = mine.find((j) => j.status === 'en_route') ?? null;
  const enRouteCustomer = (enRouteJob?.location?.coordinates ?? null) as [number, number] | null;
  const { position, error: geoError } = useProviderTracking(online, enRouteJob?._id ?? null);
  const route = useLiveRoute(position?.coords ?? null, enRouteCustomer);

  if (loading || !user || user.role !== 'provider') {
    return <div className="container-page py-24 text-center text-ink/70">Checking access…</div>;
  }

  const caps = me?.provider?.capabilities ?? {};
  const activeJobs = mine.filter((j) => ACTIVE_STATUSES.includes(j.status));

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Provider</p>
          <h1 className="mt-1 text-3xl">{me?.provider?.businessName ?? user.name}</h1>
        </div>
        <button onClick={logout} className="btn-outline px-3 py-2 text-sm">
          Sign out
        </button>
      </div>

      {/* Online toggle */}
      <div className="mt-6 card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-forest">
            You are {online ? 'Online' : 'Offline'}
          </p>
          <p className="text-sm text-ink/70">
            {online ? 'You’re receiving jobs in your area.' : 'Go online to start receiving jobs.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleOnline(!online)}
          disabled={toggling}
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition ${online ? 'bg-secondary' : 'bg-trim'}`}
          aria-pressed={online}
          aria-label="Toggle online status"
        >
          <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow transition ${online ? 'translate-x-11' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Stats + capabilities */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-ink/70">Active jobs</p>
          <p className="mt-1 text-3xl font-bold text-forest">{me?.stats?.activeJobs ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink/70">Completed</p>
          <p className="mt-1 text-3xl font-bold text-forest">{me?.stats?.completedJobs ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink/70">Capabilities</p>
          <p className="mt-2 font-semibold text-forest">
            {[caps.roadside && 'Roadside', caps.recovery && 'Recovery'].filter(Boolean).join(' + ') || '—'}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Labour £{me?.provider?.rates?.labourPerHour ?? 0}/hr · Mileage £{me?.provider?.rates?.mileagePerMile ?? 0}/mi
          </p>
        </div>
      </div>

      {note && (
        <p className="mt-4 rounded-lg bg-mint-100 px-4 py-3 text-forest" role="status">
          {note}
        </p>
      )}

      {/* Live location — active only while Online (real GPS over Socket.IO). */}
      {online && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Your live location</h2>
            {enRouteJob && route && (
              <div className="rounded-lg bg-mint-100 px-4 py-2 text-sm">
                <span className="font-semibold text-forest">{fmtEta(route.durationSeconds)}</span>
                <span className="text-ink/60"> · {(route.distanceMeters / 1000).toFixed(1)} km to customer</span>
              </div>
            )}
          </div>

          {geoError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-red-800" role="alert">
              {geoError} — allow location access so customers can track you.
            </p>
          ) : !position ? (
            <p className="mt-3 card text-ink/70">
              Waiting for your location… allow location access when your browser prompts.
            </p>
          ) : (
            <div className="mt-3">
              <LiveMap
                provider={position.coords}
                providerAccuracy={position.accuracy}
                providerHeading={position.heading}
                customer={enRouteCustomer}
                route={route?.geometry ?? null}
              />
              <p className="mt-2 text-xs text-ink/60">
                Sharing your live location while Online
                {enRouteJob ? ' · streaming to your active job' : ''} · accuracy ±
                {Math.round(position.accuracy ?? 0)} m.
              </p>
            </div>
          )}
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Incoming feed */}
        <section>
          <h2 className="text-2xl">Incoming jobs</h2>
          {!online ? (
            <p className="mt-4 card text-ink/70">Go online to see jobs near you.</p>
          ) : available.length === 0 ? (
            <p className="mt-4 card text-ink/70">No matching jobs right now. Polling every 8s…</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {available.map((j) => (
                <li key={j.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold capitalize text-forest">{j.serviceType}</p>
                      <p className="text-sm text-ink/80">{j.description || 'No description'}</p>
                      <p className="mt-1 text-xs text-ink/60">{j.area}</p>
                    </div>
                    <span className="price-tag">£{j.quote?.total}</span>
                  </div>
                  <button onClick={() => accept(j.id)} className="btn-primary mt-3 w-full">
                    Accept job
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* My jobs */}
        <section>
          <h2 className="text-2xl">My jobs</h2>
          {activeJobs.length === 0 ? (
            <p className="mt-4 card text-ink/70">No active jobs yet. Accept one to get started.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activeJobs.map((j) => (
                <li key={j._id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold capitalize text-forest">{j.serviceType}</p>
                      <p className="text-sm text-ink/80">
                        Customer: {j.customer?.name ?? '—'}
                        {j.customer?.phone ? ` · ${j.customer.phone}` : ''}
                      </p>
                      {j.location?.address && (
                        <p className="mt-1 text-xs text-ink/60">📍 {j.location.address}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-accent/40 px-2.5 py-1 text-xs font-semibold capitalize">
                      {String(j.status).replace('_', ' ')}
                    </span>
                  </div>
                  {NEXT_LABEL[j.status] && (
                    <button onClick={() => advance(j._id)} className="btn-outline mt-3 w-full">
                      {NEXT_LABEL[j.status]}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
