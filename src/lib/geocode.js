/**
 * geocode.js — keyless city → coordinates lookup via Open-Meteo.
 *
 * This is the app's only network call, and it is optional: a user can skip it
 * entirely by entering latitude/longitude manually. The endpoint is free and
 * needs no API key. It conveniently also returns the IANA timezone, which we
 * thread into the local→UTC conversion (see datetime.js).
 */

const ENDPOINT =
  import.meta.env.VITE_GEOCODING_ENDPOINT || 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Search for places matching `query`.
 *
 * @param {string} query
 * @param {AbortSignal} [signal]  optional, so callers can cancel stale lookups.
 * @returns {Promise<Array<{
 *   id: number, name: string, label: string,
 *   latitude: number, longitude: number, timezone: string
 * }>>}
 */
export async function searchPlaces(query, signal) {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set('name', q);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();

  return (data.results || []).map((r) => ({
    id: r.id,
    name: r.name,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone || 'UTC',
  }));
}
