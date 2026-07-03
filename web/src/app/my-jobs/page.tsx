'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

const LIVE = ['accepted', 'paid', 'en_route', 'arrived', 'in_progress'];

export default function MyJobsPage() {
  const { user, loading, authedFetch } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/my-jobs');
    else if (user.role !== 'customer') router.replace('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role !== 'customer') return;
    authedFetch('/api/jobs/mine')
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => setJobs(d.jobs ?? []))
      .finally(() => setBusy(false));
  }, [user, authedFetch]);

  if (loading || !user || user.role !== 'customer') {
    return <div className="container-page py-24 text-center text-ink/70">Loading…</div>;
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 text-3xl">My jobs</h1>
        </div>
        <Link href="/request-help" className="btn-accent">
          Request help
        </Link>
      </div>

      {busy ? (
        <p className="mt-10 text-ink/60">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="mt-10 card text-center">
          <p className="text-ink/80">You haven’t requested any help yet.</p>
          <Link href="/request-help" className="btn-primary mt-4">
            Get help now
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {jobs.map((j) => {
            const live = LIVE.includes(j.status);
            return (
              <li key={j._id} className="card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold capitalize text-forest">{j.serviceType} · £{j.quote?.total}</p>
                  <p className="text-sm text-ink/70">
                    {new Date(j.createdAt).toLocaleString('en-GB')} · {j.location?.address ?? 'Location set'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      live ? 'bg-secondary text-white' : 'bg-mint-100 text-forest'
                    }`}
                  >
                    {String(j.status).replace('_', ' ')}
                  </span>
                  <Link href={`/jobs/${j._id}`} className="btn-outline px-4 py-2 text-sm">
                    {live ? 'Track' : 'View'}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
