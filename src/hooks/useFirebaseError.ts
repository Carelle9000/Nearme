import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';

interface ErrorDetail {
  code: string;
  message: string;
  userFriendly: string;
}

export function useFirebaseError() {
  const parseError = useCallback((error: unknown): ErrorDetail => {
    const firebaseError = error as FirebaseError;

    const errorMap: { [key: string]: string } = {
      'permission-denied': 'Vous n\'avez pas la permission d\'accéder à cette ressource.',
      'not-found': 'La ressource n\'a pas été trouvée.',
      'already-exists': 'Cette ressource existe déjà.',
      'failed-precondition': 'La condition n\'a pas pu être satisfaite.',
      'aborted': 'L\'opération a été annulée.',
      'out-of-range': 'La valeur est hors limites.',
      'unimplemented': 'Cette fonctionnalité n\'est pas implémentée.',
      'internal': 'Une erreur interne s\'est produite.',
      'unavailable': 'Le service est temporairement indisponible.',
      'data-loss': 'Une perte de données a eu lieu.',
      'unauthenticated': 'Vous devez vous connecter.',
      'deadline-exceeded': 'L\'opération a pris trop de temps.',
      'resource-exhausted': 'Les ressources sont épuisées.',
      'invalid-argument': 'Un argument invalide a été fourni.',
    };

    const code = firebaseError?.code || 'unknown-error';
    const userFriendly = errorMap[code] || 'Une erreur s\'est produite. Veuillez réessayer.';

    return {
      code,
      message: firebaseError?.message || 'Erreur inconnue',
      userFriendly,
    };
  }, []);

  return { parseError };
}
