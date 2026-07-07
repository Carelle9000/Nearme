import { Toast as RNToast } from 'react-native';
import { useToast as useToastContext } from '@/context/toast-context';

/**
 * Helper pour utiliser les toasts en dehors des composants React
 * ou pour un meilleur typage
 */
export const createToastHelper = (useToast: ReturnType<typeof useToastContext>) => {
  return {
    /**
     * Affiche un toast de succès
     * @param message Le message à afficher
     * @param duration Durée en ms (défaut: 3000)
     */
    showSuccess: (message: string, duration = 3000) => {
      useToast.success(message, duration);
    },

    /**
     * Affiche un toast d'erreur
     * @param message Le message à afficher
     * @param duration Durée en ms (défaut: 3000)
     */
    showError: (message: string, duration = 3000) => {
      useToast.error(message, duration);
    },

    /**
     * Affiche un toast d'avertissement
     * @param message Le message à afficher
     * @param duration Durée en ms (défaut: 3000)
     */
    showWarning: (message: string, duration = 3000) => {
      useToast.warning(message, duration);
    },

    /**
     * Affiche un toast informatif
     * @param message Le message à afficher
     * @param duration Durée en ms (défaut: 3000)
     */
    showInfo: (message: string, duration = 3000) => {
      useToast.info(message, duration);
    },

    /**
     * Remplace Alert.alert() par un toast
     * Utilise 'warning' pour les erreurs de validation
     * Utilise 'error' pour les erreurs système
     */
    replaceAlert: (title: string, message: string, isError = false) => {
      if (isError) {
        useToast.error(message || title);
      } else {
        useToast.warning(message || title);
      }
    },
  };
};

/**
 * Template pour la migration d'Alert.alert() vers toast
 *
 * AVANT:
 * Alert.alert(t('error'), t('displayNameCannotBeEmpty'));
 *
 * APRÈS:
 * const { warning } = useToast();
 * warning(t('displayNameCannotBeEmpty'));
 */

/**
 * Types d'erreurs courants:
 * - Validation: warning() ⚠️
 * - Permission: error() ❌
 * - Réseau: error() ❌
 * - Succès: success() ✅
 * - Info: info() ℹ️
 */
