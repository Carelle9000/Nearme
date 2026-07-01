import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { get, ref } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Profile } from '../models/user';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';
import { DiscoverFilters, useDiscoverFilters } from './discover-filters-context';

interface DiscoverContextType {
  profiles: Profile[];
  filteredProfiles: Profile[];
  isLoading: boolean;
  error: string | null;
  likedIds: Set<string>;
  nopeIds: Set<string>;
  favoriteIds: Set<string>;
  currentIndex: number;
  lastMatch: { targetId: string; matchId: string } | null;
  clearLastMatch: () => void;

  loadNearbyProfiles: (latitude: number, longitude: number) => Promise<void>;
  applyFilters: (filters: DiscoverFilters, profilesToFilter?: Profile[]) => void;
  like: (targetId: string) => Promise<{ isMatch: boolean }>;
  nope: (targetId: string) => Promise<void>;
  favorite: (targetId: string) => Promise<void>;
  nextProfile: () => void;
  previousProfile: () => void;
  goToProfile: (index: number) => void;
}

const DiscoverContext = createContext<DiscoverContextType | undefined>(undefined);

export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { filters } = useDiscoverFilters();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [nopeIds, setNopeIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<DiscoverFilters | null>(null);
  const [lastMatch, setLastMatch] = useState<{ targetId: string; matchId: string } | null>(null);

  const clearLastMatch = useCallback(() => setLastMatch(null), []);

  // Bug #4: refs kept in sync so loadNearbyProfiles stays stable across likes/nopes.
  const likedIdsRef = useRef(likedIds);
  const nopeIdsRef = useRef(nopeIds);
  const filtersRef = useRef(filters);
  useEffect(() => { likedIdsRef.current = likedIds; }, [likedIds]);
  useEffect(() => { nopeIdsRef.current = nopeIds; }, [nopeIds]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

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

      // Bug #6: reject profiles with unknown age when an age filter is active.
      if (age === null) return false;
      if (age < filters.minAge || age > filters.maxAge) return false;

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
      const [likes, favSnap, nopeSnap] = await Promise.all([
        userService.getSentLikes(user.id),
        get(ref(rtdb, `profiles/${user.id}/favorites`)),
        get(ref(rtdb, `profiles/${user.id}/nopes`)),
      ]);
      setLikedIds(new Set(likes));
      setFavoriteIds(new Set(favSnap.val() ? Object.keys(favSnap.val()) : []));
      setNopeIds(new Set(nopeSnap.val() ? Object.keys(nopeSnap.val()) : []));
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

      // Bug #8: use a robust "has valid coordinates" check instead of latitude===0
      // (0 is a valid latitude — equator).
      const hasValidUserCoords =
        user.location &&
        typeof user.location.latitude === 'number' &&
        typeof user.location.longitude === 'number' &&
        Number.isFinite(user.location.latitude) &&
        Number.isFinite(user.location.longitude);

      if (!hasValidUserCoords) {
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

      const maxDistance = filtersRef.current?.maxDistance || 500;
      const nearbyProfiles = await userService.getNearbyProfiles(latitude, longitude, maxDistance);
      console.log(`[Discover] Got ${nearbyProfiles.length} nearby profiles within ${maxDistance}km`);

      // Filter out current user, already liked/noped (read via refs to keep callback stable).
      const currentLiked = likedIdsRef.current;
      const currentNoped = nopeIdsRef.current;
      const filtered = nearbyProfiles.filter(
        (p) => p.uid !== user.id && !currentLiked.has(p.uid) && !currentNoped.has(p.uid)
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
  }, [user]);

  // Apply filters when profiles change (separate effect to avoid infinite loop)
  useEffect(() => {
    if (profiles.length > 0) {
      if (currentFilters) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        applyFilters(currentFilters, profiles);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const like = useCallback(async (targetId: string): Promise<{ isMatch: boolean }> => {
    if (!user?.id) return { isMatch: false };

    try {
      const result = await userService.saveLike(user.id, targetId);
      setLikedIds((prev) => new Set([...prev, targetId]));
      if (result.isMatch && result.matchId) {
        setLastMatch({ targetId, matchId: result.matchId });
      }
      nextProfile();
      return { isMatch: result.isMatch };
    } catch (err: any) {
      const msg = err?.code === 'PERMISSION_DENIED'
        ? 'Action refusée : permissions insuffisantes'
        : 'Impossible de liker le profil';
      console.error('Error liking profile:', err);
      setError(msg);
      return { isMatch: false };
    }
  }, [user?.id, nextProfile]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const nope = useCallback(async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveNope(user.id, targetId);
      setNopeIds((prev) => new Set([...prev, targetId]));
      nextProfile();
    } catch (err: any) {
      const msg = err?.code === 'PERMISSION_DENIED'
        ? 'Action refusée : permissions insuffisantes'
        : 'Impossible de rejeter le profil';
      console.error('Error rejecting profile:', err);
      setError(msg);
    }
  }, [user?.id, nextProfile]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const favorite = useCallback(async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveFavorite(user.id, targetId);
      setFavoriteIds((prev) => new Set([...prev, targetId]));
    } catch (err: any) {
      const msg = err?.code === 'PERMISSION_DENIED'
        ? 'Action refusée : permissions insuffisantes'
        : 'Impossible de mettre en favori le profil';
      console.error('Error favoriting profile:', err);
      setError(msg);
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
        lastMatch,
        clearLastMatch,
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
