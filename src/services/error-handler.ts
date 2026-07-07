import { TRANSLATIONS } from '../constants/locales';

type TranslationKey = keyof typeof TRANSLATIONS.fr;

/**
 * Maps Firebase error codes to translation keys
 */
const FIREBASE_ERROR_MAP: Record<string, TranslationKey> = {
  'auth/email-already-in-use': 'errorFirebaseEmailExists',
  'auth/invalid-email': 'errorFirebaseInvalidEmail',
  'auth/user-not-found': 'errorFirebaseUserNotFound',
  'auth/wrong-password': 'errorFirebaseWrongPassword',
  'auth/invalid-credential': 'errorFirebaseInvalidCredential',
  'auth/weak-password': 'errorFirebaseWeakPassword',
  'auth/too-many-requests': 'errorFirebaseTooManyRequests',
  'auth/requires-recent-login': 'errorFirebaseRequiresRecentLogin',
  'auth/invalid-oob-code': 'errorFirebaseInvalidOobCode',
  'auth/operation-not-allowed': 'errorFirebaseOperationNotAllowed',
  'auth/network-request-failed': 'errorFirebaseNetworkRequestFailed',
  'auth/service-disabled': 'errorFirebaseServiceDisabled',
  'auth/invalid-api-key': 'errorFirebaseInvalidApiKey',
  'auth/app-not-authorized': 'errorFirebaseAppNotAuthorized',
  'auth/invalid-user-token': 'errorFirebaseInvalidUserToken',
  'auth/user-token-expired': 'errorFirebaseUserTokenExpired',
  'auth/null-user': 'errorFirebaseNullUser',
  'auth/internal-error': 'errorFirebaseInternalError',
  'PERMISSION_DENIED': 'errorFirebasePermissionDenied',
};

/**
 * Maps generic database/RTDB error codes to translation keys
 */
const DATABASE_ERROR_MAP: Record<string, TranslationKey> = {
  'permission-denied': 'errorPermissionDenied',
  'not-found': 'errorNotFound',
  'already-exists': 'errorAlreadyExists',
  'failed-precondition': 'errorFailedPrecondition',
  'aborted': 'errorAborted',
  'out-of-range': 'errorOutOfRange',
  'unimplemented': 'errorUnimplemented',
  'internal': 'errorInternalError',
  'unavailable': 'errorUnavailable',
  'data-loss': 'errorDataLoss',
  'unauthenticated': 'errorUnauthenticated',
  'deadline-exceeded': 'errorDeadlineExceeded',
  'resource-exhausted': 'errorResourceExhausted',
  'invalid-argument': 'errorInvalidArgument',
};

interface ErrorDetail {
  code: string;
  message: string;
  translationKey: TranslationKey;
}

/**
 * Translates Firebase error codes to translation keys
 * Falls back to generic error if code is not recognized
 */
export function getFirebaseErrorKey(code: string): TranslationKey {
  return FIREBASE_ERROR_MAP[code] || 'errorUnknown';
}

/**
 * Translates database error codes to translation keys
 * Falls back to generic error if code is not recognized
 */
export function getDatabaseErrorKey(code: string): TranslationKey {
  return DATABASE_ERROR_MAP[code] || 'errorUnknown';
}

/**
 * Parses any error object and returns the translation key
 * Tries Firebase errors first, then database errors, then fallback
 */
export function getErrorKey(error: unknown): TranslationKey {
  const firebaseError = error as any;
  const code = firebaseError?.code || firebaseError?.message;

  if (!code) return 'errorUnknown';

  // Try Firebase error map first
  if (FIREBASE_ERROR_MAP[code]) {
    return FIREBASE_ERROR_MAP[code];
  }

  // Try database error map
  if (DATABASE_ERROR_MAP[code]) {
    return DATABASE_ERROR_MAP[code];
  }

  return 'errorUnknown';
}

/**
 * Returns the translation key for app-specific errors
 * Used for non-Firebase errors (network, validation, business logic)
 */
export const APP_ERROR_KEYS = {
  unableToUnblockProfile: 'errorUnableToUnblockProfile' as const,
  unableToBlockProfile: 'errorUnableToBlockProfile' as const,
  unableToCreateConversation: 'errorUnableToCreateConversation' as const,
  unableToUndoAction: 'errorUnableToUndoAction' as const,
  locationServicesRequired: 'errorLocationServicesRequired' as const,
  unableToSendLike: 'errorUnableToSendLike' as const,
  unableToPassProfile: 'errorUnableToPassProfile' as const,
  unableToUpdateProfile: 'errorUnableToUpdateProfile' as const,
  unableToTakePhoto: 'errorUnableToTakePhoto' as const,
  unableToLoadPhoto: 'errorUnableToLoadPhoto' as const,
  unableToVerifyAge: 'errorUnableToVerifyAge' as const,
  profileBlocked: 'errorProfileBlocked' as const,
  profileUnblocked: 'errorProfileUnblocked' as const,
  photoUploaded: 'errorPhotoUploaded' as const,
} as const;

/**
 * Hook-friendly error parser for use in components
 * Returns the error detail with the translation key
 */
export function parseError(error: unknown): ErrorDetail {
  const firebaseError = error as any;
  const code = firebaseError?.code || 'unknown-error';
  const message = firebaseError?.message || '';

  return {
    code,
    message,
    translationKey: getErrorKey(error),
  };
}
