import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '../models/user';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';
import { DiscoverFilters } from './discover-filters-context';

interface DiscoverContextType {
  profiles: Profile[];
  filteredProfiles: Profile[];
  isLoading: boolean;
  error: string | null;
  likedIds: Set<string>;
  nopeIds: Set<string>;
  favoriteIds: Set<string>;
  currentIndex: number;

  loadNearbyProfiles: (latitude: number, longitude: number) => Promise<void>;
  applyFilters: (filters: DiscoverFilters, profilesToFilter?: Profile[]) => void;
  like: (targetId: string) => Promise<void>;
  nope: (targetId: string) => Promise<void>;
  favorite: (targetId: string) => Promise<void>;
  nextProfile: () => void;
  previousProfile: () => void;
  goToProfile: (index: number) => void;
}

const DiscoverContext = createContext<DiscoverContextType | undefined>(undefined);

export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [nopeIds, setNopeIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<DiscoverFilters | null>(null);

  const calculateAge = (birthDate: string | undefined): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const applyFilters = (filters: DiscoverFilters, profilesToFilter?: Profile[]) => {
    setCurrentFilters(filters);
    const sourcesToFilter = profilesToFilter || profiles;

    const filtered = sourcesToFilter.filter((profile) => {
      const age = calculateAge(profile.birthDate);

      // Filter by age
      if (age && (age < filters.minAge || age > filters.maxAge)) {
        return false;
      }

      // Filter by gender
      if (filters.gender && filters.gender !== 'all' && profile.gender !== filters.gender) {
        return false;
      }

      // Filter by interests
      if (filters.interests.length > 0) {
        const profileInterests = profile.interests || [];
        const hasMatchingInterest = filters.interests.some((interest) =>
          profileInterests.includes(interest)
        );
        if (!hasMatchingInterest) {
          return false;
        }
      }

      return true;
    });

    setFilteredProfiles(filtered);
    setCurrentIndex(0);
  };

  const loadUserInteractions = async () => {
    if (!user?.id) return;
    try {
      const likes = await userService.getSentLikes(user.id);
      setLikedIds(new Set(likes));
    } catch (err) {
      console.error('Error loading user interactions:', err);
    }
  };

  // Load initial profiles and user's liked/noped profiles
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (user && isMounted) {
        await loadUserInteractions();
      }
    };

    load().catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadNearbyProfiles = useCallback(async (latitude: number, longitude: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      console.log(`[Discover] Loading profiles for user ${user.id} at location (${latitude}, ${longitude})`);

      // Save user's location to their profile if not already saved
      if (!user.location || user.location.latitude === 0) {
        console.log(`[Discover] Saving user location to profile...`);
        try {
          await userService.updateProfile(user.id, {
            location: {
              latitude,
              longitude,
            },
          });
          console.log(`[Discover] User location saved successfully`);
        } catch (locError) {
          console.warn(`[Discover] Failed to save user location:`, locError);
        }
      }

      const nearbyProfiles = await userService.getNearbyProfiles(latitude, longitude, 50);
      console.log(`[Discover] Got ${nearbyProfiles.length} nearby profiles`);

      // Filter out current user, already liked/noped
      const filtered = nearbyProfiles.filter(
        (p) => p.uid !== user.id && !likedIds.has(p.uid) && !nopeIds.has(p.uid)
      );

      console.log(`[Discover] After filtering: ${filtered.length} profiles remain`);

      setProfiles(filtered);
      setCurrentIndex(0);
    } catch (err: any) {
      const errorMsg = err.message || 'Impossible de charger les profils';
      setError(errorMsg);
      console.error('[Discover] Error loading nearby profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, likedIds, nopeIds]);

  // Apply filters when profiles change (separate effect to avoid infinite loop)
  useEffect(() => {
    if (profiles.length > 0) {
      if (currentFilters) {
        applyFilters(currentFilters, profiles);
      } else {
        setFilteredProfiles(profiles);
      }
    }
  }, [profiles]);

  const nextProfile = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, filteredProfiles.length - 1));
  }, [filteredProfiles.length]);

  const previousProfile = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToProfile = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, filteredProfiles.length - 1)));
  }, [filteredProfiles.length]);

  const like = useCallback(async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveLike(user.id, targetId);
      setLikedIds((prev) => new Set([...prev, targetId]));
      nextProfile();
    } catch (err) {
      console.error('Error liking profile:', err);
      setError('Impossible de liker le profil');
    }
  }, [user?.id, nextProfile]);

  const nope = useCallback(async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveNope(user.id, targetId);
      setNopeIds((prev) => new Set([...prev, targetId]));
      nextProfile();
    } catch (err) {
      console.error('Error rejecting profile:', err);
      setError('Impossible de rejeter le profil');
    }
  }, [user?.id, nextProfile]);

  const favorite = useCallback(async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveFavorite(user.id, targetId);
      setFavoriteIds((prev) => new Set([...prev, targetId]));
    } catch (err) {
      console.error('Error favoriting profile:', err);
      setError('Impossible de mettre en favori le profil');
    }
  }, [user?.id]);

  return (
    <DiscoverContext.Provider
      value={{
        profiles: filteredProfiles,
        filteredProfiles,
        isLoading,
        error,
        likedIds,
        nopeIds,
        favoriteIds,
        currentIndex,
        loadNearbyProfiles,
        applyFilters,
        like,
        nope,
        favorite,
        nextProfile,
        previousProfile,
        goToProfile,
      }}
    >
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscover() {
  const context = useContext(DiscoverContext);
  if (!context) {
    throw new Error('useDiscover must be used within DiscoverProvider');
  }
  return context;
}
