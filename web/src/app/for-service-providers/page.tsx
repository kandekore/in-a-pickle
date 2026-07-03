import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { pageMetadata } from '@/lib/seo';
import { providers } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: providers.seo.title,
  description: providers.seo.description,
  path: '/for-service-providers',
  ogImage: providers.heroImage,
});

export default function ServiceProvidersPage() {
  return <ContentPage content={providers} eyebrow="For Service Providers" />;
}
