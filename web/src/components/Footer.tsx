import Link from 'next/link';
import Image from 'next/image';
import { navItems, site } from '@/lib/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="sheen-night mt-20 border-t border-white/10 text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={site.logo}
              alt={`${site.name} logo`}
              width={56}
              height={56}
              className="h-11 w-auto"
            />
            <span className="font-display text-lg font-extrabold tracking-tightish">{site.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-white/70">{site.tagline}</p>
          <p className="mt-4 max-w-xs text-sm text-white/50">
            Pay-as-you-need breakdown &amp; recovery. No subscriptions — help when you need it.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/75 underline-offset-4 hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-signal">Get started</h2>
          <p className="mt-4 text-sm text-white/70">
            Need help right now? Request assistance and see a clear, fixed price upfront.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link href="/request-help" className="btn-accent">
              Get help now
            </Link>
            <Link href="/for-service-providers" className="btn-ghost-light">
              Become a provider
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-sm text-white/50 sm:flex-row">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>Built for drivers and independent providers across the UK.</p>
        </div>
      </div>
    </footer>
  );
}
