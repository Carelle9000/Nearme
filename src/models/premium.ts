/**
 * Premium subscription and analytics models
 * All timestamps stored as ISO strings in Firebase, converted to Date in app
 */

export type PremiumTier = 'free' | 'trial' | 'premium';

export type PremiumFeature =
  | 'view_who_liked'           // Voir qui m'a aimé
  | 'message_without_match'    // Message sans match
  | 'undo'                      // Revenir sur like/dislike
  | 'advanced_filters'          // Filtres avancés
  | 'unlimited_search_radius'   // Rayon illimité
  | 'profile_analytics'         // Statistiques détaillées
  | 'priority_messages'         // Messages prioritaires (badge visible)
  | 'styled_profile';           // Profil stylisé premium

/**
 * Represents a user's premium subscription status
 */
export interface PremiumSubscription {
  isActive: boolean;
  tier: PremiumTier;
  startDate?: string;           // ISO string in Firebase
  expiryDate?: string;          // ISO string in Firebase
  autoRenew?: boolean;
  cancelledAt?: string;         // ISO string in Firebase
  purchaseToken?: string;       // Google Play purchase token
  productId?: string;           // Google Play product ID
}

/**
 * Profile view and like statistics (Premium only)
 */
export interface DiscoverStats {
  profileViews: number;         // Total profile views
  likesReceived: number;        // Total likes received
  lastUpdated: string;          // ISO string in Firebase
  monthlyViews?: Record<string, number>;    // { 'june-2026': 45 }
  monthlyLikes?: Record<string, number>;    // { 'june-2026': 12 }
}

/**
 * User's profile analytics and premium usage stats
 */
export interface ProfileAnalytics {
  stats: DiscoverStats;
  undoCount: number;            // Nombre d'undo utilisés ce mois
  undoLimit: number;            // Limite mensuelle (ex: 5 pour free, illimité pour premium)
  messagesSent: number;         // Messages total
  messagesInitialUsed: number;  // Messages initiaux sans match utilisés
  lastUpdated: string;          // ISO string
}

/**
 * Record of who has viewed or liked a user's profile
 * Stored under profiles/{userId}/received_interactions/
 */
export interface ProfileInteraction {
  userId: string;              // ID de la personne qui a liké/vu
  type: 'view' | 'like';       // Type d'interaction
  createdAt: string;           // ISO string in Firebase
}

/**
 * Undo action history for tracking monthly usage
 */
export interface UndoAction {
  targetUserId: string;        // Profil sur lequel on a fait undo
  originalAction: 'like' | 'nope'; // Ce qu'on annule
  createdAt: string;           // ISO string in Firebase
}
