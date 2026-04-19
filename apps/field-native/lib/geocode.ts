// Nominatim geocoding (OpenStreetMap). Free, no API key. Rate-limited to
// ~1 req/sec; include a User-Agent per their usage policy.
//
// Docs: https://nominatim.org/release-docs/latest/api/Search/

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

const BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ClearWire-Field-App/0.1 (contact: johnstonetechs@gmail.com)';

export async function geocodeAddress(query: string, limit = 5): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${BASE}?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=0`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Geocode failed (${res.status})`);
  }
  const json = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return json.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
  }));
}
