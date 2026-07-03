import { Suspense } from 'react';
import type { Metadata } from 'next';
import RequestHelpFlow from '@/components/RequestHelpFlow';

export const metadata: Metadata = {
  title: 'Request Help',
  description:
    'Request on-demand breakdown assistance or recovery. See a clear fixed price upfront and get matched with the nearest available provider.',
  robots: { index: false, follow: false },
};

export default function RequestHelpPage() {
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Get help now</p>
      <h1 className="mt-2 text-4xl">Request breakdown help</h1>
      <p className="mt-3 max-w-prose text-lg text-ink/90">
        Tell us what you need and where you are. You’ll see a transparent, fixed price before you
        commit — and pay only once a provider accepts.
      </p>

      <div className="mt-10">
        <Suspense fallback={<p>Loading…</p>}>
          <RequestHelpFlow />
        </Suspense>
      </div>
    </div>
  );
}
