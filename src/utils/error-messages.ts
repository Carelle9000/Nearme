import { TRANSLATIONS } from '../constants/locales';
import { sanitizeForTransmission } from './string-normalization';

type TranslationKey = keyof typeof TRANSLATIONS.fr;

/**
 * Get translated error message with UTF-8 safety
 * Ensures special characters are properly encoded
 */
export function getErrorMessage(
  translationKey: TranslationKey,
  language: 'fr' | 'en' | 'de' | 'zh' | 'ko' | 'ja' | 'pt' = 'fr'
): string {
  const translation = TRANSLATIONS[language][translationKey];
  if (!translation) return 'Une erreur s\'est produite';
  return sanitizeForTransmission(translation);
}

/**
 * Format error message for display in UI
 * Handles line breaks and special formatting
 */
export function formatErrorForDisplay(message: string): string {
  if (!message) return '';

  // Normalize the message
  let formatted = sanitizeForTransmission(message);

  // Replace escaped quotes with regular quotes for display
  formatted = formatted.replace(/\\'/g, "'");
  formatted = formatted.replace(/\\"/g, '"');

  return formatted;
}

/**
 * Create a properly encoded error object for logging/transmission
 */
export function createSafeError(
  code: string,
  message: string,
  translationKey?: TranslationKey
) {
  return {
    code,
    message: sanitizeForTransmission(message),
    translationKey: translationKey || 'errorUnknown',
    timestamp: new Date().toISOString(),
  };
}
