import Link from 'next/link';
import type { Product } from '@/lib/site';

const serviceLabel: Record<Product['serviceType'], string> = {
  roadside: 'Roadside',
  recovery: 'Recovery',
  unsure: 'Flexible',
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card card-hover flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">
            {serviceLabel[product.serviceType]}
          </p>
          <h3 className="mt-1 text-xl">{product.name}</h3>
        </div>
        <div className="text-right leading-none">
          <span className="price-tag">£{product.price}</span>
          <span className="mt-1 block text-[0.7rem] font-semibold text-ink/50">call-out</span>
        </div>
      </div>
      <p className="mt-4 flex-1 text-sm text-ink/80">{product.shortDescription}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={{ pathname: '/request-help', query: { service: product.serviceType } }}
          className="btn-primary flex-1"
        >
          Request this
        </Link>
        <Link href={`/services/${product.slug}`} className="btn-outline">
          Details
        </Link>
      </div>
    </article>
  );
}
