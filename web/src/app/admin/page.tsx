'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import LiveDispatch from '@/components/admin/LiveDispatch';

type Tab = 'dispatch' | 'jobs' | 'users' | 'providers' | 'payments';

interface Stats {
  users: { total: number; customers: number; providers: number; admins: number };
  providersOnline: number;
  jobs: { total: number; active: number; byStatus: Record<string, number> };
  payments: { grossRevenue: number; commissionRevenue: number };
}

export default function AdminPage() {
  const { user, loading, logout, authedFetch } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>('jobs');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState(false);

  // Route guard — admins only.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login?next=/admin');
    else if (user.role !== 'admin') router.replace('/');
  }, [loading, user, router]);

  const loadStats = useCallback(() => {
    authedFetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => undefined);
  }, [authedFetch]);

  const loadTab = useCallback(
    (t: Tab) => {
      if (t === 'dispatch') return; // live view manages its own data over Socket.IO
      setBusy(true);
      authedFetch(`/api/admin/${t}`)
        .then((r) => (r.ok ? r.json() : { [t]: [] }))
        .then((d) => setRows((d[t] as Record<string, unknown>[]) ?? []))
        .catch(() => setRows([]))
        .finally(() => setBusy(false));
    },
    [authedFetch],
  );

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
      loadTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  async function toggleSuspension(userId: string, suspended: boolean) {
    await authedFetch(`/api/admin/users/${userId}/suspension`, {
      method: 'PATCH',
      body: JSON.stringify({ suspended }),
    });
    loadTab(tab);
    loadStats();
  }

  if (loading || !user || user.role !== 'admin') {
    return <div className="container-page py-24 text-center text-ink/70">Checking access…</div>;
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-1 text-3xl">Platform dashboard</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink/70">
            Signed in as <strong className="text-forest">{user.name}</strong>
          </span>
          <button onClick={logout} className="btn-outline px-3 py-2 text-sm">
            Sign out
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats?.users.total} sub={`${stats?.users.customers ?? 0} customers · ${stats?.users.providers ?? 0} providers`} />
        <StatCard label="Providers online" value={stats?.providersOnline} sub="available for dispatch" />
        <StatCard label="Jobs" value={stats?.jobs.total} sub={`${stats?.jobs.active ?? 0} active now`} />
        <StatCard label="Gross / commission" value={stats ? `£${stats.payments.grossRevenue}` : undefined} sub={stats ? `£${stats.payments.commissionRevenue} platform (5%)` : ''} />
      </div>

      {/* Tabs */}
      <div className="mt-10 flex flex-wrap gap-2 border-b border-trim">
        {(['dispatch', 'jobs', 'users', 'providers', 'payments'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 font-semibold capitalize transition ${
              tab === t ? 'border-secondary text-forest' : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            {t === 'dispatch' ? 'Live dispatch' : t === 'jobs' ? 'Recent jobs' : t}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        {tab === 'dispatch' ? (
          <LiveDispatch />
        ) : busy ? (
          <p className="py-10 text-center text-ink/60">Loading…</p>
        ) : (
          <TabTable tab={tab} rows={rows} onToggleSuspension={toggleSuspension} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value?: number | string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      <p className="mt-1 text-3xl font-bold text-forest">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-ink/60">{sub}</p>}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function TabTable({
  tab,
  rows,
  onToggleSuspension,
}: {
  tab: Tab;
  rows: Record<string, any>[];
  onToggleSuspension: (userId: string, suspended: boolean) => void;
}) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-ink/60">Nothing here yet.</p>;
  }

  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('en-GB') : '—');

  if (tab === 'jobs') {
    return (
      <Table head={['Created', 'Service', 'Status', 'Customer', 'Provider', 'Fee']}>
        {rows.map((j) => (
          <tr key={j._id} className="border-t border-trim">
            <Td>{fmt(j.createdAt)}</Td>
            <Td className="capitalize">{j.serviceType}</Td>
            <Td><Badge status={j.status} /></Td>
            <Td>{j.customer?.name ?? '—'}</Td>
            <Td>{j.provider?.businessName ?? '—'}</Td>
            <Td>£{j.quote?.total ?? '—'}</Td>
          </tr>
        ))}
      </Table>
    );
  }

  if (tab === 'users') {
    return (
      <Table head={['Name', 'Email', 'Role', 'Status', 'Action']}>
        {rows.map((u) => (
          <tr key={u._id} className="border-t border-trim">
            <Td>{u.name}</Td>
            <Td>{u.email}</Td>
            <Td className="capitalize">{u.role}</Td>
            <Td>{u.suspended ? <span className="text-red-700">Suspended</span> : <span className="text-secondary">Active</span>}</Td>
            <Td>
              {u.role === 'admin' ? (
                <span className="text-ink/40">—</span>
              ) : (
                <button
                  onClick={() => onToggleSuspension(u._id, !u.suspended)}
                  className="btn-outline px-3 py-1.5 text-xs"
                >
                  {u.suspended ? 'Reinstate' : 'Suspend'}
                </button>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    );
  }

  if (tab === 'providers') {
    return (
      <Table head={['Business', 'Operator', 'Capabilities', 'Online', 'Compliant', 'Status']}>
        {rows.map((p) => (
          <tr key={p._id} className="border-t border-trim">
            <Td>{p.businessName ?? '—'}</Td>
            <Td>{p.user?.name ?? '—'}</Td>
            <Td>
              {[p.capabilities?.roadside && 'Roadside', p.capabilities?.recovery && 'Recovery'].filter(Boolean).join(' + ') || '—'}
            </Td>
            <Td>{p.online ? <span className="text-secondary">● Online</span> : <span className="text-ink/50">Offline</span>}</Td>
            <Td>{p.onboardingComplete ? '✓' : '✗'}</Td>
            <Td>{p.user?.suspended ? <span className="text-red-700">Suspended</span> : 'Active'}</Td>
          </tr>
        ))}
      </Table>
    );
  }

  // payments
  return (
    <Table head={['Created', 'Customer', 'Amount', 'Commission', 'Provider net', 'Status']}>
      {rows.map((p) => (
        <tr key={p._id} className="border-t border-trim">
          <Td>{fmt(p.createdAt)}</Td>
          <Td>{p.customer?.name ?? '—'}</Td>
          <Td>£{p.amount}</Td>
          <Td>£{p.commission}</Td>
          <Td>£{p.providerNet}</Td>
          <Td><Badge status={p.status} /></Td>
        </tr>
      ))}
    </Table>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[680px] border-collapse text-sm">
      <thead>
        <tr className="text-left text-ink/60">
          {head.map((h) => (
            <th key={h} className="pb-2 pr-4 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 pr-4 ${className}`}>{children}</td>;
}

function Badge({ status }: { status: string }) {
  const tone =
    ['paid', 'released', 'completed', 'held'].includes(status)
      ? 'bg-mint-100 text-forest'
      : ['disputed', 'failed', 'refunded', 'cancelled'].includes(status)
        ? 'bg-red-50 text-red-700'
        : 'bg-accent/40 text-ink';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}>{status.replace('_', ' ')}</span>;
}
