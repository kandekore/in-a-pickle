import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: string;
  /** Short trust points rendered as a checked row under the CTAs. */
  highlights?: string[];
  /** Compact padding for interior/content pages. */
  compact?: boolean;
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Hero({
  eyebrow,
  headline,
  subheadline,
  cta,
  secondaryCta,
  image,
  highlights,
  compact = false,
}: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-white">
      {/* Background photography */}
      {image && (
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      {/* Legibility scrim + brand sheen */}
      <div className={`absolute inset-0 -z-10 ${image ? 'scrim-hero' : 'sheen-night'}`} />
      {!image && <div className="sheen-night absolute inset-0 -z-10" />}

      <div
        className={`container-page ${
          compact ? 'py-16 md:py-20' : 'py-20 md:py-28 lg:py-32'
        }`}
      >
        <div className="max-w-2xl animate-fade-up">
          {eyebrow && <p className="eyebrow eyebrow-light mb-4">{eyebrow}</p>}
          <h1
            className={`font-display font-extrabold tracking-tightish text-white ${
              compact ? 'text-4xl sm:text-5xl' : 'text-[2.6rem] leading-[1.03] sm:text-6xl'
            }`}
          >
            {headline}
          </h1>
          {subheadline && (
            <p className="mt-5 max-w-xl text-lg text-white/80">{subheadline}</p>
          )}

          {(cta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {cta && (
                <Link href={cta.href} className="btn-accent btn-lg">
                  {cta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link href={secondaryCta.href} className="btn-ghost-light btn-lg">
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}

          {highlights && highlights.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/85">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <span className="text-signal">
                    <Check />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
