import type { Metadata } from 'next';
import { site } from './site';

/**
 * Per-page metadata builder implementing the brief's cascade:
 *   page value → site fallback → derived. Includes canonical, OG and Twitter.
 */
export function pageMetadata(opts: {
  title?: string;
  description?: string;
  path: string; // e.g. "/about-us"
  ogImage?: string;
}): Metadata {
  const title = opts.title?.trim() || site.fallbackTitle;
  const description = opts.description?.trim() || site.description;
  const url = `${site.url}${opts.path === '/' ? '' : opts.path}`;
  const image = opts.ogImage ?? '/assets/images/adobestock_259920605.webp';

  // If the page title already carries the brand (home, product SEO titles),
  // use it verbatim so the layout's "%s | In a Pickle Breakdown" template
  // doesn't append the brand twice. Short titles (About, FAQ…) still get it.
  const carriesBrand = title.toLowerCase().includes('in a pickle');

  return {
    title: carriesBrand ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: 'website',
      images: [{ url: image }],
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/** LocalBusiness JSON-LD (seo.schema_type === 'LocalBusiness'). */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url: site.url,
    image: `${site.url}${site.logo}`,
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    priceRange: '££',
    knowsAbout: [
      'Breakdown assistance',
      'Mobile mechanic services',
      'Vehicle recovery',
      'Vehicle diagnostics',
      'Emergency call-outs',
    ],
  };
}
