import type { ServiceType } from '../models/Job.js';

/** The product catalogue from the brief (products.items). Source of truth for the API. */
export interface CatalogueItem {
  serviceType: ServiceType;
  name: string;
  slug: string;
  price: number;
  currency: 'GBP';
  shortDescription: string;
}

export const catalogue: CatalogueItem[] = [
  {
    serviceType: 'roadside',
    name: 'Roadside Assistance',
    slug: 'roadside-assistance',
    price: 50,
    currency: 'GBP',
    shortDescription:
      'Fast roadside help from trusted local mechanics. Includes a visual inspection and up to 30 minutes of on-scene assistance to get you moving again.',
  },
  {
    serviceType: 'recovery',
    name: 'Recovery',
    slug: 'recovery',
    price: 80,
    currency: 'GBP',
    shortDescription:
      "If your vehicle can't be fixed at the roadside, choose Recovery for safe transport to a nearby location within 10 miles.",
  },
  {
    serviceType: 'unsure',
    name: 'Unsure (Assistance with Possible Recovery)',
    slug: 'roadside-assistance-but-possible-recovery',
    price: 100,
    currency: 'GBP',
    shortDescription:
      "Not sure whether you need a mechanic or a tow? Choose this option and we'll send someone who can do both.",
  },
];
