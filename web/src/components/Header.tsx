'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { navItems, primaryNav, site } from '@/lib/site';
import { useAuth } from '@/lib/auth';

/** Maps each role to its home surface. */
const dashboardFor: Record<string, string> = {
  admin: '/admin',
  provider: '/provider',
  customer: '/my-jobs',
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      {/* Slim trust strip — sets a premium, confident tone above the fold. */}
      <div className="hidden bg-night text-white/70 sm:block">
        <div className="container-page flex h-9 items-center justify-between text-xs font-medium tracking-wide">
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
            Pay-as-you-need cover — no membership, no monthly fees
          </p>
          <p className="hidden items-center gap-5 md:flex">
            <span>Independent mechanics &amp; recovery, UK-wide</span>
            <Link href="/faq" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
              How it works
            </Link>
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-trim bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <Image
              src={site.logo}
              alt={`${site.name} logo`}
              width={64}
              height={64}
              className="h-11 w-auto"
              priority
            />
            <span className="hidden text-[1.05rem] font-extrabold leading-none tracking-tightish text-forest sm:block font-display">
              In a Pickle
              <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-secondary">
                Breakdown
              </span>
            </span>
          </Link>

          {/* Desktop nav — condensed, single-line labels */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-mint-50 hover:text-forest ${
                  isActive(item.href) ? 'text-forest' : 'text-ink/80'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href={dashboardFor[user.role] ?? '/'}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-forest hover:bg-mint-50"
                >
                  {user.role === 'admin' ? 'Admin' : 'My account'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="whitespace-nowrap text-sm font-semibold text-ink/60 hover:text-ink"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden whitespace-nowrap px-3 py-2 text-sm font-semibold text-ink/70 hover:text-forest lg:inline-flex"
              >
                Sign in
              </Link>
            )}

            <Link href="/request-help" className="btn-primary hidden sm:inline-flex">
              Get help now
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-trim text-forest hover:bg-mint-50 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Toggle navigation</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d={open ? 'M6 6l12 12M6 18L18 6' : 'M3 6h18M3 12h18M3 18h18'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav — full destination list */}
      {open && (
        <nav id="mobile-nav" className="border-b border-trim bg-white lg:hidden" aria-label="Mobile">
          <ul className="container-page flex flex-col py-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-3 font-semibold hover:bg-mint-50 ${
                    isActive(item.href) ? 'text-forest' : 'text-ink/80'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-3 flex flex-col gap-2 px-3">
              <Link href="/request-help" className="btn-primary" onClick={() => setOpen(false)}>
                Get help now
              </Link>
              {!user && (
                <Link href="/login" className="btn-outline" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
