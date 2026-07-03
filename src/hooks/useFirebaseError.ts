import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { getErrorKey } from '../services/error-handler';
import { useLocalization } from '../context/localization-context';

interface ErrorDetail {
  code: string;
  message: string;
  userFriendly: string;
}

export function useFirebaseError() {
  const { t } = useLocalization();

  const parseError = useCallback((error: unknown): ErrorDetail => {
    const firebaseError = error as FirebaseError;
    const code = firebaseError?.code || 'unknown-error';
    const translationKey = getErrorKey(code);
    const userFriendly = t(translationKey);

    return {
      code,
      message: firebaseError?.message || t('errorUnknown'),
      userFriendly,
    };
  }, [t]);

  return { parseError };
}
