import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../models/user';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';

interface DiscoverContextType {
  profiles: Profile[];
  isLoading: boolean;
  error: string | null;
  likedIds: Set<string>;
  nopeIds: Set<string>;
  favoriteIds: Set<string>;
  currentIndex: number;

  loadNearbyProfiles: (latitude: number, longitude: number) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [nopeIds, setNopeIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load initial profiles and user's liked/noped profiles
  useEffect(() => {
    if (user) {
      loadUserInteractions();
    }
  }, [user]);

  const loadUserInteractions = async () => {
    if (!user?.id) return;
    try {
      const likes = await userService.getSentLikes(user.id);
      setLikedIds(new Set(likes));
    } catch (err) {
      console.error('Error loading user interactions:', err);
    }
  };

  const loadNearbyProfiles = async (latitude: number, longitude: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const nearbyProfiles = await userService.getNearbyProfiles(latitude, longitude, 50);

      // Filter out current user, already liked/noped, and blocked users
      const filteredProfiles = nearbyProfiles.filter(
        (p) =>
          p.uid !== user.id &&
          !likedIds.has(p.uid) &&
          !nopeIds.has(p.uid)
      );

      setProfiles(filteredProfiles);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les profils');
      console.error('Error loading nearby profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const like = async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveLike(user.id, targetId);
      setLikedIds((prev) => new Set([...prev, targetId]));
      nextProfile();
    } catch (err) {
      console.error('Error liking profile:', err);
      setError('Impossible de liker le profil');
    }
  };

  const nope = async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveNope(user.id, targetId);
      setNopeIds((prev) => new Set([...prev, targetId]));
      nextProfile();
    } catch (err) {
      console.error('Error rejecting profile:', err);
      setError('Impossible de rejeter le profil');
    }
  };

  const favorite = async (targetId: string) => {
    if (!user?.id) return;

    try {
      await userService.saveFavorite(user.id, targetId);
      setFavoriteIds((prev) => new Set([...prev, targetId]));
    } catch (err) {
      console.error('Error favoriting profile:', err);
      setError('Impossible de mettre en favori le profil');
    }
  };

  const nextProfile = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, profiles.length - 1));
  };

  const previousProfile = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToProfile = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, profiles.length - 1)));
  };

  return (
    <DiscoverContext.Provider
      value={{
        profiles,
        isLoading,
        error,
        likedIds,
        nopeIds,
        favoriteIds,
        currentIndex,
        loadNearbyProfiles,
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
