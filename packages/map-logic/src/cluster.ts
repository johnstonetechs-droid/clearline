export interface GeoItem {
  latitude: number;
  longitude: number;
}

export interface Cluster<T extends GeoItem> {
  key: string;
  items: T[];
  latitude: number;
  longitude: number;
}

export interface ClusterOptions<T> {
  radiusMeters: number;
  groupKey: (item: T) => string;
}

/**
 * Group items within `radiusMeters` of each other AND sharing a group key.
 * Centroid is the running mean of member coordinates. Used by the outage site's
 * geographic cluster view (1500m + provider grouping).
 */
export function clusterByProximity<T extends GeoItem>(
  items: readonly T[],
  { radiusMeters, groupKey }: ClusterOptions<T>
): Cluster<T>[] {
  const clusters: Cluster<T>[] = [];

  for (const item of items) {
    const key = groupKey(item);
    const existing = clusters.find(
      (c) =>
        c.key === key &&
        haversineMeters(c.latitude, c.longitude, item.latitude, item.longitude) <=
          radiusMeters
    );
    if (existing) {
      existing.items.push(item);
      const n = existing.items.length;
      existing.latitude = (existing.latitude * (n - 1) + item.latitude) / n;
      existing.longitude = (existing.longitude * (n - 1) + item.longitude) / n;
    } else {
      clusters.push({
        key,
        items: [item],
        latitude: item.latitude,
        longitude: item.longitude,
      });
    }
  }

  return clusters;
}

/** Great-circle distance in meters between two lat/lng pairs. */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
