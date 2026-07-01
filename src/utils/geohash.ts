// ngeohash ships no types; declare the two symbols we use.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ngeohash: {
  encode: (lat: number, lng: number, precision: number) => string;
  neighbors: (hash: string) => string[];
} = require('ngeohash');

// Storage precision — 7 chars ≈ ±76 m box. Fine enough for any radius up to ~500 km.
export const GEOHASH_STORAGE_PRECISION = 7;

/**
 * Pick a prefix length whose tile radius (in km) is >= half the search radius.
 * A shorter prefix = larger tile = more profiles scanned. We pick the tightest
 * that still guarantees the 3x3 tile block covers the search circle.
 */
export function prefixLengthForRadius(radiusKm: number): number {
  if (radiusKm <= 2.4) return 5;
  if (radiusKm <= 20) return 4;
  if (radiusKm <= 78) return 3;
  if (radiusKm <= 630) return 2;
  return 1;
}

/**
 * Encode (lat, lng) to a geohash at storage precision.
 */
export function encodeLocation(latitude: number, longitude: number): string {
  return ngeohash.encode(latitude, longitude, GEOHASH_STORAGE_PRECISION);
}

/**
 * Return the 9 prefix ranges (center + 8 neighbors) covering a search circle
 * around (lat, lng). Each range is [start, end] suitable for
 * orderByChild('geohash').startAt(start).endAt(end).
 */
export function neighborPrefixRanges(
  latitude: number,
  longitude: number,
  radiusKm: number
): Array<[string, string]> {
  const prefixLen = prefixLengthForRadius(radiusKm);
  const center = ngeohash.encode(latitude, longitude, prefixLen);
  const neighbors: string[] = ngeohash.neighbors(center);
  const all = new Set<string>([center, ...neighbors]);
  return Array.from(all).map((p) => [p, p + '~'] as [string, string]);
  // '~' (0x7E) is one code point above 'z' (0x7A) in ASCII — matches every geohash
  // starting with the prefix, since base32 geohash chars are 0-9 + b-z.
}
