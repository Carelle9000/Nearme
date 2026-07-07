import { AppUser, Profile } from '../models/user';
import { PremiumFeature } from '../models/premium';

/**
 * PremiumService: Core business logic for premium features
 * Handles subscription verification, feature access control, and limits
 */
class PremiumService {
  private readonly FREE_SEARCH_RADIUS_KM = 50;
  private readonly PREMIUM_SEARCH_RADIUS_KM = Infinity;
  private readonly FREE_UNDO_LIMIT_MONTHLY = 0; // Free users can't undo
  private readonly PREMIUM_UNDO_LIMIT_MONTHLY = Infinity;
  private readonly FREE_INITIAL_MESSAGES = 0; // Can't message without match
  private readonly PREMIUM_INITIAL_MESSAGES = Infinity;

  /**
   * Check if user has an active premium subscription (includes trial)
   */
  isPremium(user: AppUser | Profile | null): boolean {
    if (!user) return false;
    return (
      user.premium?.isActive === true &&
      (user.premium?.tier === 'premium' || user.premium?.tier === 'trial') &&
      this.isSubscriptionValid(user)
    );
  }

  /**
   * Check if user subscription is still valid (not expired)
   */
  isSubscriptionValid(user: AppUser | Profile | null): boolean {
    if (!user?.premium?.isActive) return false;

    const expiryDate = user.premium.expiryDate;
    if (!expiryDate) return true; // No expiry = permanent

    const now = new Date();
    const expiry = new Date(expiryDate);
    return now < expiry;
  }

  /**
   * Get search radius based on premium status
   */
  getSearchRadius(user: AppUser | Profile | null): number {
    if (this.isPremium(user)) {
      return this.PREMIUM_SEARCH_RADIUS_KM;
    }
    return user?.preferences?.searchRadius || this.FREE_SEARCH_RADIUS_KM;
  }

  /**
   * Check if user can access a specific premium feature
   */
  canAccess(user: AppUser | Profile | null, feature: PremiumFeature): boolean {
    if (!user) return false;

    // All these features require active premium subscription
    const premiumOnlyFeatures: PremiumFeature[] = [
      'view_who_liked',
      'message_without_match',
      'undo',
      'advanced_filters',
      'unlimited_search_radius',
      'priority_messages',
      'styled_profile',
    ];

    if (premiumOnlyFeatures.includes(feature)) {
      return this.isPremium(user) && this.isSubscriptionValid(user);
    }

    // profile_analytics is also premium only
    if (feature === 'profile_analytics') {
      return this.isPremium(user) && this.isSubscriptionValid(user);
    }

    return false;
  }

  /**
   * Get undo limit based on subscription tier
   */
  getUndoLimit(user: AppUser | Profile | null): number {
    if (!this.isPremium(user)) {
      return this.FREE_UNDO_LIMIT_MONTHLY;
    }
    return this.PREMIUM_UNDO_LIMIT_MONTHLY;
  }

  /**
   * Check if user has undo actions remaining this month
   */
  canUndo(user: AppUser | Profile | null): boolean {
    if (!this.isPremium(user)) {
      return false;
    }

    const limit = this.getUndoLimit(user);
    const used = (user?.analytics?.undoCount) || 0;

    // Premium has unlimited, but verify
    return limit === Infinity || used < limit;
  }

  /**
   * Get initial message limit (messages without match)
   */
  getInitialMessageLimit(user: AppUser | Profile | null): number {
    if (!this.isPremium(user)) {
      return this.FREE_INITIAL_MESSAGES;
    }
    return this.PREMIUM_INITIAL_MESSAGES;
  }

  /**
   * Check if user can send initial message (without existing match)
   */
  canSendInitialMessage(user: AppUser | Profile | null): boolean {
    if (!this.isPremium(user)) {
      return false;
    }
    return this.canAccess(user, 'message_without_match');
  }

  /**
   * Check if user is on trial
   */
  isTrial(user: AppUser | Profile | null): boolean {
    if (!user?.premium) return false;
    return user.premium.tier === 'trial' && user.premium.isActive && this.isSubscriptionValid(user);
  }

  /**
   * Get subscription information and days remaining
   */
  getSubscriptionInfo(user: AppUser | Profile | null): {
    status: 'active' | 'expired' | 'free' | 'cancelled' | 'trial';
    tier: 'free' | 'premium' | 'trial';
    daysRemaining?: number;
    expiryDate?: Date;
  } {
    if (!user?.premium) {
      return {
        status: 'free',
        tier: 'free',
      };
    }

    if (user.premium.cancelledAt) {
      return {
        status: 'cancelled',
        tier: user.premium.tier,
        expiryDate: user.premium.expiryDate
          ? new Date(user.premium.expiryDate)
          : undefined,
      };
    }

    if (!user.premium.isActive) {
      return {
        status: 'free',
        tier: 'free',
      };
    }

    if (user.premium.expiryDate) {
      const now = new Date();
      const expiry = new Date(user.premium.expiryDate);
      const daysRemaining = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining < 0) {
        return {
          status: 'expired',
          tier: user.premium.tier,
          expiryDate: expiry,
          daysRemaining: 0,
        };
      }

      const status = user.premium.tier === 'trial' ? 'trial' : 'active';
      return {
        status,
        tier: user.premium.tier,
        daysRemaining,
        expiryDate: expiry,
      };
    }

    return {
      status: 'active',
      tier: user.premium.tier,
    };
  }

  /**
   * Check if profile should be shown to free users
   * (Premium profiles can appear at top, or separate)
   */
  shouldDisplayToFreeUser(
    profileToShow: Profile | null,
    viewerIsPremium: boolean
  ): boolean {
    if (!profileToShow) return false;
    // Free users can see all profiles, but premium profiles might be marked
    return true;
  }

  /**
   * Sort profiles: premium first if viewer is also premium
   */
  sortProfilesByPremium(
    profiles: Profile[],
    viewerIsPremium: boolean
  ): Profile[] {
    if (!viewerIsPremium) {
      return profiles; // Free users see regular order
    }

    // Premium users see premium profiles first
    return [...profiles].sort((a, b) => {
      const aPremium = this.isPremium(a) ? 1 : 0;
      const bPremium = this.isPremium(b) ? 1 : 0;
      return bPremium - aPremium;
    });
  }

  /**
   * Increment undo count (check before calling if limit allows)
   */
  incrementUndoCount(user: AppUser | Profile): void {
    if (!user.analytics) {
      user.analytics = {
        stats: {
          profileViews: 0,
          likesReceived: 0,
          lastUpdated: new Date().toISOString(),
        },
        undoCount: 0,
        undoLimit: this.getUndoLimit(user),
      };
    }
    user.analytics.undoCount = (user.analytics.undoCount || 0) + 1;
  }
}

export const premiumService = new PremiumService();
