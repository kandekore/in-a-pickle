import type { MetadataRoute } from 'next';
import { navItems, products, site } from '@/lib/site';

/**
 * XML sitemap. Priorities per the brief: home=1.0, service/about=0.8,
 * landing=0.6, others=0.5. changefreq weekly.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const priorityFor = (href: string): number => {
    if (href === '/') return 1.0;
    if (['/services', '/breakdown-assistance', '/mobile-mechanic-services', '/about-us'].includes(href))
      return 0.8;
    if (href === '/for-service-providers') return 0.6;
    return 0.5;
  };

  const pages: MetadataRoute.Sitemap = navItems.map((item) => ({
    url: `${site.url}${item.href === '/' ? '' : item.href}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: priorityFor(item.href),
  }));

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${site.url}/services/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...pages, ...productPages];
}
