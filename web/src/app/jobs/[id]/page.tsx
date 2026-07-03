'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { createSocket, type TrackingUpdate } from '@/lib/socket';
import TrackingMap from '@/components/TrackingMap';
import { useLiveRoute } from '@/components/map/useLiveRoute';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STEPS: { key: string; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'en_route', label: 'On the way' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

function fmtEta(seconds?: number | null): string {
  if (seconds == null) return '—';
  if (seconds <= 0) return 'Arriving now';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function JobTrackingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [status, setStatus] = useState<string>('requested');
  const [provider, setProvider] = useState<[number, number] | null>(null);
  const [providerMeta, setProviderMeta] = useState<{ heading?: number | null; accuracy?: number | null }>({});
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=/jobs/${jobId}`);
  }, [loading, user, router, jobId]);

  // Load the job, then open the socket and join its room.
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('iap_access_token');
    if (!token) return;

    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load this job'))))
      .then((d) => {
        if (cancelled) return;
        setJob(d.job);
        setStatus(d.job.status);
        if (d.job.tracking?.providerLocation?.length === 2) setProvider(d.job.tracking.providerLocation);
        if (d.job.tracking?.etaSeconds != null) setEta(d.job.tracking.etaSeconds);
        if (d.job.tracking?.heading != null || d.job.tracking?.accuracy != null) {
          setProviderMeta({ heading: d.job.tracking.heading, accuracy: d.job.tracking.accuracy });
        }
      })
      .catch((e) => !cancelled && setError(e.message));

    const socket = createSocket(token);
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('job:join', jobId));
    socket.on('tracking:update', (u: TrackingUpdate) => {
      if (u.jobId !== jobId) return;
      setProvider([u.lng, u.lat]);
      setProviderMeta({ heading: u.heading, accuracy: u.accuracy });
      if (u.etaSeconds != null) setEta(u.etaSeconds);
    });
    socket.on('job:status', (s: { jobId: string; status: string }) => {
      if (s.jobId === jobId) setStatus(s.status);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, jobId]);

  const customer = useMemo<[number, number] | null>(
    () => (job?.location?.coordinates?.length === 2 ? job.location.coordinates : null),
    [job],
  );

  // Accurate driving route + ETA via ORS (falls back to the socket ETA if the
  // routing provider is unavailable).
  const route = useLiveRoute(provider, customer);
  const etaSeconds = route?.durationSeconds ?? eta;
  const distanceKm = route ? route.distanceMeters / 1000 : null;

  const currentStep = STEPS.findIndex((s) => s.key === status);

  if (loading || !user) {
    return <div className="container-page py-24 text-center text-ink/70">Loading…</div>;
  }

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-3xl">We couldn’t load that job</h1>
        <p className="mt-3 text-ink/80">{error}</p>
        <Link href="/my-jobs" className="btn-primary mt-6">
          Back to my jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <Link href="/my-jobs" className="text-sm text-secondary underline">
        ← My jobs
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow capitalize">{job?.serviceType} job</p>
          <h1 className="mt-1 text-3xl">Tracking your provider</h1>
        </div>
        {['en_route'].includes(status) && (
          <div className="rounded-xl bg-mint-100 px-5 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">ETA</p>
            <p className="text-2xl font-bold text-forest">{fmtEta(etaSeconds)}</p>
            {distanceKm != null && (
              <p className="mt-0.5 text-xs font-medium text-ink/60">{distanceKm.toFixed(1)} km away</p>
            )}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <ol className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                active ? 'bg-secondary text-white' : done ? 'bg-mint-100 text-forest' : 'bg-trim/40 text-ink/50'
              }`}
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${active ? 'bg-white text-secondary' : done ? 'bg-secondary text-white' : 'bg-white text-ink/40'}`}>
                {done ? '✓' : i + 1}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Map */}
        <div>
          {customer ? (
            <TrackingMap
              customer={customer}
              provider={provider}
              route={route?.geometry ?? null}
              providerAccuracy={providerMeta.accuracy}
              providerHeading={providerMeta.heading}
            />
          ) : (
            <div className="grid h-[420px] place-items-center rounded-2xl border border-trim text-ink/60">
              No location on this job.
            </div>
          )}
          {status === 'requested' && (
            <p className="mt-3 text-sm text-ink/70">
              Waiting for a provider to accept. The map goes live once they’re on the way.
            </p>
          )}
          {status === 'arrived' && (
            <p className="mt-3 rounded-lg bg-mint-100 px-4 py-3 text-forest">
              Your provider has arrived. Location sharing has stopped.
            </p>
          )}
        </div>

        {/* Provider / job details */}
        <aside className="h-fit card">
          <h2 className="text-xl">Your provider</h2>
          {job?.provider ? (
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-bold text-forest">{job.provider.businessName ?? job.provider.user?.name}</p>
              {job.provider.user?.phone && <p className="text-ink/80">📞 {job.provider.user.phone}</p>}
              {job.provider.vehicle?.registration && (
                <p className="text-ink/80">
                  🚐 {job.provider.vehicle.make} {job.provider.vehicle.model} · {job.provider.vehicle.registration}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/70">Assigned once a provider accepts.</p>
          )}

          <dl className="mt-5 space-y-1 border-t border-trim pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/70">Fee paid</dt>
              <dd>£{job?.quote?.total ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/70">Status</dt>
              <dd className="capitalize">{status.replace('_', ' ')}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-ink/60">
            In-app chat unlocks here once payment is confirmed (coming next).
          </p>
        </aside>
      </div>
    </div>
  );
}
