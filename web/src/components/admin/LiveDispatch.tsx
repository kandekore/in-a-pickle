'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/lib/auth';
import { createSocket, type TrackingUpdate } from '@/lib/socket';
import LiveMap from '@/components/map/LiveMap';
import { useLiveRoute } from '@/components/map/useLiveRoute';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIVE = ['accepted', 'paid', 'en_route', 'arrived', 'in_progress'];

interface LiveState {
  provider?: [number, number] | null;
  eta?: number | null;
  status?: string;
  heading?: number | null;
  accuracy?: number | null;
}

function fmtEta(seconds?: number | null): string {
  if (seconds == null) return '—';
  const m = Math.round(seconds / 60);
  return m >= 1 ? `${m} min` : 'Arriving';
}

/**
 * Admin live dispatch — every active job with its live provider position,
 * status and ETA, updated in real time over the existing Socket.IO job rooms.
 * Selecting a job opens the shared live map. Mobile-first single column that
 * splits into list + map on larger screens.
 */
export default function LiveDispatch() {
  const { authedFetch } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [live, setLive] = useState<Record<string, LiveState>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const jobsRef = useRef<string[]>([]);

  // Load active jobs; poll every 10s so newly-accepted jobs appear.
  useEffect(() => {
    let stop = false;
    const load = () =>
      authedFetch('/api/admin/jobs')
        .then((r) => (r.ok ? r.json() : { jobs: [] }))
        .then((d) => {
          if (stop) return;
          const active = (d.jobs ?? []).filter((j: any) => ACTIVE.includes(j.status));
          setJobs(active);
          jobsRef.current = active.map((j: any) => String(j._id));
        })
        .catch(() => undefined);
    load();
    const id = setInterval(load, 10000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [authedFetch]);

  // One socket for the whole dispatch board; join every active job room.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('iap_access_token') : null;
    if (!token) return;
    const socket = createSocket(token);
    socketRef.current = socket;

    const joinAll = () => jobsRef.current.forEach((id) => socket.emit('job:join', id));
    socket.on('connect', joinAll);

    socket.on('tracking:update', (u: TrackingUpdate) => {
      setLive((prev) => ({
        ...prev,
        [u.jobId]: {
          ...prev[u.jobId],
          provider: [u.lng, u.lat],
          eta: u.etaSeconds ?? prev[u.jobId]?.eta,
          heading: u.heading,
          accuracy: u.accuracy,
        },
      }));
    });
    socket.on('job:status', (s: { jobId: string; status: string }) => {
      setLive((prev) => ({ ...prev, [s.jobId]: { ...prev[s.jobId], status: s.status } }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join rooms whenever the active set changes.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    jobs.forEach((j) => socket.emit('job:join', String(j._id)));
  }, [jobs]);

  const rows = useMemo(
    () =>
      jobs.map((j) => {
        const id = String(j._id);
        const l = live[id] ?? {};
        return {
          id,
          job: j,
          status: l.status ?? j.status,
          provider: (l.provider ?? j.tracking?.providerLocation ?? null) as [number, number] | null,
          eta: l.eta ?? j.tracking?.etaSeconds ?? null,
          heading: l.heading ?? j.tracking?.heading ?? null,
          accuracy: l.accuracy ?? j.tracking?.accuracy ?? null,
        };
      }),
    [jobs, live],
  );

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const selCustomer = (selected?.job?.location?.coordinates ?? null) as [number, number] | null;
  const route = useLiveRoute(selected?.provider ?? null, selCustomer);

  if (jobs.length === 0) {
    return <p className="py-10 text-center text-ink/60">No active jobs right now. This board updates live.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Live list */}
      <div className="space-y-3">
        {rows.map((r) => {
          const isSel = r.id === selectedId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSel ? 'border-secondary bg-mint-50' : 'border-trim bg-white hover:border-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold capitalize text-forest">{r.job.serviceType}</p>
                  <p className="text-sm text-ink/80">
                    {r.job.customer?.name ?? 'Customer'} → {r.job.provider?.businessName ?? 'Unassigned'}
                  </p>
                </div>
                <span className="rounded-full bg-accent/40 px-2.5 py-1 text-xs font-semibold capitalize">
                  {String(r.status).replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/60">
                <span>ETA: <strong className="text-forest">{fmtEta(r.eta)}</strong></span>
                <span>
                  Provider:{' '}
                  {r.provider ? `${r.provider[1].toFixed(4)}, ${r.provider[0].toFixed(4)}` : 'awaiting GPS'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live map for the selected job */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        {selected && selCustomer ? (
          <>
            <LiveMap
              customer={selCustomer}
              provider={selected.provider}
              providerAccuracy={selected.accuracy}
              providerHeading={selected.heading}
              route={route?.geometry ?? null}
            />
            <p className="mt-2 text-sm text-ink/70">
              {selected.job.customer?.name ?? 'Customer'} · {selected.job.provider?.businessName ?? 'Unassigned'} ·{' '}
              <span className="capitalize">{String(selected.status).replace('_', ' ')}</span>
              {route && ` · ${(route.distanceMeters / 1000).toFixed(1)} km · ${fmtEta(route.durationSeconds)}`}
            </p>
          </>
        ) : (
          <div className="grid h-[420px] place-items-center rounded-2xl border border-trim bg-mint-50 text-ink/60">
            Select a job to open its live map.
          </div>
        )}
      </div>
    </div>
  );
}
