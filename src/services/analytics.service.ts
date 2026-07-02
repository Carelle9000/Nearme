import { ref, get, set, update } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Profile } from '../models/user';
import { DiscoverStats, ProfileInteraction } from '../models/premium';

/**
 * AnalyticsService: Tracks profile views, likes, and statistics
 * Data is stored in Firebase under: profiles/{userId}/analytics/
 */
class AnalyticsService {
  /**
   * Track that a profile was viewed
   * Called when a profile card is displayed to a user
   */
  async trackProfileView(
    viewerId: string,
    viewedProfileId: string
  ): Promise<void> {
    if (!viewerId || !viewedProfileId) return;

    try {
      const now = Date.now();
      const interaction: ProfileInteraction = {
        userId: viewerId,
        type: 'view',
        createdAt: new Date().toISOString(),
      };

      // Store who viewed the profile
      await set(
        ref(
          rtdb,
          `profiles/${viewedProfileId}/analytics/views/${viewerId}`
        ),
        interaction
      );

      // Also update view count
      const statsRef = ref(
        rtdb,
        `profiles/${viewedProfileId}/analytics/stats`
      );
      const snapshot = await get(statsRef);
      const currentStats = snapshot.val() || { profileViews: 0 };

      await update(statsRef, {
        profileViews: (currentStats.profileViews || 0) + 1,
        lastUpdated: now,
      });
    } catch (error) {
      console.warn('[Analytics] Failed to track profile view:', error);
      // Non-blocking: don't fail the app if analytics fails
    }
  }

  /**
   * Track that a profile was liked
   * Called when user likes a profile
   */
  async trackLike(
    likerId: string,
    likedProfileId: string
  ): Promise<void> {
    if (!likerId || !likedProfileId) return;

    try {
      const now = Date.now();
      const interaction: ProfileInteraction = {
        userId: likerId,
        type: 'like',
        createdAt: new Date().toISOString(),
      };

      // Store who liked the profile
      await set(
        ref(
          rtdb,
          `profiles/${likedProfileId}/analytics/likes/${likerId}`
        ),
        interaction
      );

      // Update like count
      const statsRef = ref(
        rtdb,
        `profiles/${likedProfileId}/analytics/stats`
      );
      const snapshot = await get(statsRef);
      const currentStats = snapshot.val() || { likesReceived: 0 };

      await update(statsRef, {
        likesReceived: (currentStats.likesReceived || 0) + 1,
        lastUpdated: now,
      });
    } catch (error) {
      console.warn('[Analytics] Failed to track like:', error);
      // Non-blocking
    }
  }

  /**
   * Get user's profile statistics (views and likes received)
   * Only accessible to premium users
   */
  async getProfileStats(userId: string): Promise<DiscoverStats | null> {
    try {
      const snapshot = await get(
        ref(rtdb, `profiles/${userId}/analytics/stats`)
      );

      if (!snapshot.exists()) {
        return {
          profileViews: 0,
          likesReceived: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      return snapshot.val() as DiscoverStats;
    } catch (error) {
      console.error('[Analytics] Failed to get profile stats:', error);
      return null;
    }
  }

  /**
   * Get list of users who liked the profile
   * Only accessible to premium users
   */
  async getWhoLikedYou(userId: string): Promise<Profile[]> {
    try {
      const snapshot = await get(
        ref(rtdb, `profiles/${userId}/analytics/likes`)
      );

      if (!snapshot.exists()) {
        return [];
      }

      const likesData = snapshot.val();
      const likerIds = Object.keys(likesData || {});

      // Fetch profiles of users who liked
      const profiles = await Promise.all(
        likerIds.map((likerId) => this.getProfile(likerId))
      );

      return profiles.filter((p) => p !== null) as Profile[];
    } catch (error) {
      console.error('[Analytics] Failed to get who liked you:', error);
      return [];
    }
  }

  /**
   * Get list of users who viewed the profile
   */
  async getWhoViewedYou(userId: string): Promise<Profile[]> {
    try {
      const snapshot = await get(
        ref(rtdb, `profiles/${userId}/analytics/views`)
      );

      if (!snapshot.exists()) {
        return [];
      }

      const viewsData = snapshot.val();
      const viewerIds = Object.keys(viewsData || {});

      // Fetch profiles of users who viewed
      const profiles = await Promise.all(
        viewerIds.map((viewerId) => this.getProfile(viewerId))
      );

      return profiles.filter((p) => p !== null) as Profile[];
    } catch (error) {
      console.error('[Analytics] Failed to get who viewed you:', error);
      return [];
    }
  }

  /**
   * Helper: Get profile by ID
   */
  private async getProfile(uid: string): Promise<Profile | null> {
    try {
      const snapshot = await get(ref(rtdb, `profiles/${uid}`));
      return snapshot.val() as Profile | null;
    } catch (error) {
      console.error('[Analytics] Failed to fetch profile:', error);
      return null;
    }
  }

  /**
   * Clear analytics data for a user (useful for account deletion)
   */
  async clearAnalytics(userId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/analytics`), null);
    } catch (error) {
      console.error('[Analytics] Failed to clear analytics:', error);
      throw error;
    }
  }

  /**
   * Get monthly stats for a specific month
   */
  async getMonthlyStats(
    userId: string,
    month: string // Format: "june-2026"
  ): Promise<{ views: number; likes: number } | null> {
    try {
      const snapshot = await get(
        ref(rtdb, `profiles/${userId}/analytics/monthly/${month}`)
      );

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.val();
    } catch (error) {
      console.error('[Analytics] Failed to get monthly stats:', error);
      return null;
    }
  }
}

export const analyticsService = new AnalyticsService();
