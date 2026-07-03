import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt. seo.ai_crawler_policy === 'allow_all' and no disallowed paths,
 * so we allow all crawlers and point them at the sitemap. The authenticated
 * app surface (request flow / future dashboards) is kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/request-help', '/admin', '/provider', '/my-jobs', '/jobs/', '/login', '/api/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
