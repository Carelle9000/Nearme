import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  orderBy,
  limit,
  DocumentSnapshot,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Profile } from '../models/user';

class UserService {
  async getProfile(uid: string): Promise<Profile | null> {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', uid));
      return docSnap.exists() ? (docSnap.data() as Profile) : null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'profiles', uid), {
        ...data,
        updatedAt: new Date().toISOString(),
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
      // For now, fetch all profiles and filter client-side
      // In production, use Firestore geohashing with geoflutterfire equivalent
      const q = query(collection(db, 'profiles'));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((doc) => doc.data() as Profile)
        .filter((profile) => {
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
      await setDoc(
        doc(db, `profiles/${userId}/sent_likes/${targetId}`),
        { createdAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error saving like:', error);
      throw error;
    }
  }

  async saveNope(userId: string, targetId: string): Promise<void> {
    try {
      await setDoc(
        doc(db, `profiles/${userId}/nopes/${targetId}`),
        { createdAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error saving nope:', error);
      throw error;
    }
  }

  async saveFavorite(userId: string, targetId: string): Promise<void> {
    try {
      await setDoc(
        doc(db, `profiles/${userId}/favorites/${targetId}`),
        { createdAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error saving favorite:', error);
      throw error;
    }
  }

  async getSentLikes(userId: string): Promise<string[]> {
    try {
      const snapshot = await getDocs(
        collection(db, `profiles/${userId}/sent_likes`)
      );
      return snapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error('Error fetching sent likes:', error);
      throw error;
    }
  }

  async getFavorites(userId: string): Promise<Profile[]> {
    try {
      const snapshot = await getDocs(
        collection(db, `profiles/${userId}/favorites`)
      );
      const favoriteIds = snapshot.docs.map((doc) => doc.id);
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
