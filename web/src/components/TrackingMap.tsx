'use client';

import LiveMap from './map/LiveMap';

type LngLat = [number, number];

/**
 * Live tracking map — public interface preserved from the original component
 * (`customer` + `provider`) so existing callers keep working. Now backed by
 * MapLibre GL + OpenStreetMap via <LiveMap>, with optional route/heading/accuracy
 * overlays layered on top.
 */
interface Props {
  customer: LngLat; // [lng, lat]
  provider: LngLat | null;
  route?: LngLat[] | null;
  providerAccuracy?: number | null;
  providerHeading?: number | null;
  className?: string;
}

export default function TrackingMap({
  customer,
  provider,
  route,
  providerAccuracy,
  providerHeading,
  className,
}: Props) {
  return (
    <LiveMap
      customer={customer}
      provider={provider}
      route={route}
      providerAccuracy={providerAccuracy}
      providerHeading={providerHeading}
      fitToPoints
      className={className ?? 'h-[420px] w-full rounded-2xl border border-trim'}
    />
  );
}
