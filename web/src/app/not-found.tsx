import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl">We couldn’t find that page</h1>
      <p className="mt-3 max-w-prose text-ink/90">
        The page you’re after may have moved. Let’s get you back on the road.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/request-help" className="btn-accent">
          Get help now
        </Link>
      </div>
    </div>
  );
}
