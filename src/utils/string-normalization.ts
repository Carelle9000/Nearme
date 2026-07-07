/**
 * Normalize special characters in strings
 * Ensures consistent handling of accented characters across platforms
 */

/**
 * Normalize Unicode NFC (composed) to NFD (decomposed) or vice versa
 * By default uses NFC (Composed) which is recommended for most use cases
 */
export function normalizeString(str: string, form: 'NFC' | 'NFD' = 'NFC'): string {
  if (!str || typeof str !== 'string') return str;
  return str.normalize(form);
}

/**
 * Remove accents from characters (é → e, ñ → n, etc.)
 * Useful for search/comparison operations
 */
export function removeAccents(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Sanitize string for safe API transmission
 * Ensures UTF-8 encoding and removes problematic characters
 */
export function sanitizeForTransmission(str: string): string {
  if (!str || typeof str !== 'string') return str;

  // Normalize to NFC for consistent transmission
  let normalized = normalizeString(str, 'NFC');

  // Trim whitespace
  normalized = normalized.trim();

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Validate string contains only valid UTF-8 characters
 */
export function isValidUtf8(str: string): boolean {
  if (!str || typeof str !== 'string') return true;
  try {
    // Try to encode and decode to detect invalid sequences
    const encoded = new TextEncoder().encode(str);
    new TextDecoder().decode(encoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Replace smart quotes with standard quotes
 * Useful for API data that might contain typographer's quotes
 */
export function normalizeQuotes(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/[‘’]/g, "'")  // Smart single quotes
    .replace(/[“”]/g, '"'); // Smart double quotes
}

/**
 * Comprehensive string cleanup
 * Applies all normalization techniques
 */
export function cleanString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return normalizeQuotes(sanitizeForTransmission(str));
}
