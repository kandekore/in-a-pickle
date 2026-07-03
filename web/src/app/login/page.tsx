'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const homeFor: Record<string, string> = {
  admin: '/admin',
  provider: '/provider',
  customer: '/my-jobs',
};

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const user = await login(String(form.get('email')), String(form.get('password')));
      const next = params.get('next');
      router.push(next || homeFor[user.role] || '/');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <label className="block">
        <span className="mb-1 block font-semibold text-forest">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-trim px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-semibold text-forest">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-trim px-3 py-2"
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-800" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-4xl">Sign in</h1>
        <p className="mt-3 text-ink/90">
          Customers, providers and administrators all sign in here. You’ll be taken to the right
          place for your role.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p>Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Demo credentials for the seeded accounts (local build only). */}
        <div className="mt-6 card bg-mint-50 text-sm">
          <p className="font-bold text-forest">Demo accounts (seeded)</p>
          <ul className="mt-2 space-y-1 text-ink/80">
            <li>Admin — <code>admin@pickle.test</code> / <code>admin123</code></li>
            <li>Provider — <code>marcus.both@pickle.test</code> / <code>provider123</code></li>
            <li>Customer — <code>driver@example.com</code> / <code>hunter2pickle</code></li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-ink/70">
          Are you a mechanic or recovery operator?{' '}
          <Link href="/for-service-providers" className="text-secondary underline">
            Learn about joining
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
