import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppUser } from '../models/user';
import { PremiumFeature, DiscoverStats } from '../models/premium';
import { premiumService } from '../services/premium.service';
import { analyticsService } from '../services/analytics.service';
import { useAuth } from './auth-context';

interface SubscriptionInfo {
  status: 'active' | 'expired' | 'free' | 'cancelled' | 'trial';
  tier: 'free' | 'premium' | 'trial';
  daysRemaining?: number;
  expiryDate?: Date;
}

interface PremiumContextType {
  // Subscription status
  isPremium: boolean;
  isTrial: boolean;
  subscriptionInfo: SubscriptionInfo;

  // Feature access control
  canAccess: (feature: PremiumFeature) => boolean;
  canUndo: boolean;
  canSendInitialMessage: boolean;

  // Search and preferences
  searchRadius: number;
  undoLimit: number;

  // Analytics (premium only)
  stats: DiscoverStats | null;
  whoLikedYou: any[]; // Array of profiles
  whoViewedYou: any[]; // Array of profiles
  loadAnalytics: () => Promise<void>;
  isLoadingAnalytics: boolean;

  // Refresh
  refreshPremiumStatus: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Subscription state
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    status: 'free',
    tier: 'free',
  });

  // Analytics state
  const [stats, setStats] = useState<DiscoverStats | null>(null);
  const [whoLikedYou, setWhoLikedYou] = useState<any[]>([]);
  const [whoViewedYou, setWhoViewedYou] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Update subscription info when user changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      const info = user ? premiumService.getSubscriptionInfo(user) : { status: 'free', tier: 'free' };
      if (mounted) {
        setSubscriptionInfo(info);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Load analytics when user becomes premium
  useEffect(() => {
    if (user && premiumService.isPremium(user)) {
      // Optionally auto-load analytics, or let component request it
      // loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    setIsLoadingAnalytics(true);
    try {
      // Load stats
      const statsData = await analyticsService.getProfileStats(user.id);
      setStats(statsData);

      // Load who liked you
      const likedProfiles = await analyticsService.getWhoLikedYou(user.id);
      setWhoLikedYou(likedProfiles);

      // Load who viewed you
      const viewedProfiles = await analyticsService.getWhoViewedYou(user.id);
      setWhoViewedYou(viewedProfiles);
    } catch (error) {
      console.error('[PremiumContext] Failed to load analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [user]);

  const canAccess = useCallback(
    (feature: PremiumFeature): boolean => {
      if (!user) return false;
      return premiumService.canAccess(user, feature);
    },
    [user]
  );

  const canUndo = premiumService.canUndo(user);
  const canSendInitialMessage = premiumService.canSendInitialMessage(user);
  const searchRadius = premiumService.getSearchRadius(user);
  const undoLimit = premiumService.getUndoLimit(user);

  const refreshPremiumStatus = useCallback(() => {
    if (!user) return;
    const info = premiumService.getSubscriptionInfo(user);
    setSubscriptionInfo(info);
  }, [user]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium: premiumService.isPremium(user),
        isTrial: premiumService.isTrial(user),
        subscriptionInfo,
        canAccess,
        canUndo,
        canSendInitialMessage,
        searchRadius,
        undoLimit,
        stats,
        whoLikedYou,
        whoViewedYou,
        loadAnalytics,
        isLoadingAnalytics,
        refreshPremiumStatus,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
}
