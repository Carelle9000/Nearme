import {
  ref,
  get,
  set,
  update,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Profile } from '../models/user';

class UserService {
  async getProfile(uid: string): Promise<Profile | null> {
    try {
      const snapshot = await get(ref(rtdb, `profiles/${uid}`));
      return snapshot.val() as Profile || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
    try {
      await update(ref(rtdb, `profiles/${uid}`), {
        ...data,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async getNearbyProfiles(
    latitude: number,
    longitude: number,
    radiusInKm: number = 50
  ): Promise<Profile[]> {
    try {
      const snapshot = await get(ref(rtdb, 'profiles'));

      if (!snapshot.val()) return [];

      return Object.values(snapshot.val() as Record<string, Profile>)
        .filter((profile: Profile) => {
          if (!profile.location) return false;
          const distance = this.calculateDistance(
            latitude,
            longitude,
            profile.location.latitude,
            profile.location.longitude
          );
          return distance <= radiusInKm;
        });
    } catch (error) {
      console.error('Error fetching nearby profiles:', error);
      throw error;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async saveLike(userId: string, targetId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/sent_likes/${targetId}`), {
        createdAt: Date.now(),
        targetId,
      });
    } catch (error) {
      console.error('Error saving like:', error);
      throw error;
    }
  }

  async saveNope(userId: string, targetId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/nopes/${targetId}`), {
        createdAt: Date.now(),
        targetId,
      });
    } catch (error) {
      console.error('Error saving nope:', error);
      throw error;
    }
  }

  async saveFavorite(userId: string, targetId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/favorites/${targetId}`), {
        createdAt: Date.now(),
        targetId,
      });
    } catch (error) {
      console.error('Error saving favorite:', error);
      throw error;
    }
  }

  async getSentLikes(userId: string): Promise<string[]> {
    try {
      const snapshot = await get(ref(rtdb, `profiles/${userId}/sent_likes`));
      if (!snapshot.val()) return [];
      return Object.keys(snapshot.val());
    } catch (error) {
      console.error('Error fetching sent likes:', error);
      throw error;
    }
  }

  async getFavorites(userId: string): Promise<Profile[]> {
    try {
      const snapshot = await get(ref(rtdb, `profiles/${userId}/favorites`));
      if (!snapshot.val()) return [];

      const favoriteIds = Object.keys(snapshot.val());
      const profiles = await Promise.all(
        favoriteIds.map((id) => this.getProfile(id))
      );
      return profiles.filter((p) => p !== null) as Profile[];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
