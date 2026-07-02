import {
  ref,
  get,
  set,
  update,
  query,
  orderByChild,
  startAt,
  endAt,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Profile } from '../models/user';
import { matchService } from './match.service';
import { encodeLocation, neighborPrefixRanges } from '../utils/geohash';

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
    // Bug #3: keep geohash in sync whenever location coordinates are updated,
    // so the indexed nearby query can find this profile.
    const payload: Record<string, any> = { ...data, updatedAt: Date.now() };
    const loc = data.location;
    if (
      loc &&
      typeof loc.latitude === 'number' &&
      typeof loc.longitude === 'number' &&
      Number.isFinite(loc.latitude) &&
      Number.isFinite(loc.longitude)
    ) {
      payload.geohash = encodeLocation(loc.latitude, loc.longitude);
    }

    try {
      await update(ref(rtdb, `profiles/${uid}`), payload);
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] updateProfile', { uid, dataKeys: Object.keys(data) }, error);
      } else {
        console.error('Error updating profile:', error);
      }
      throw error;
    }
  }

  async getNearbyProfiles(
    latitude: number,
    longitude: number,
    radiusInKm: number = 50
  ): Promise<Profile[]> {
    // Diagnostic: reject obviously invalid search coords so we don't silently
    // "find 0 profiles" because expo-location handed us (0,0) or NaN.
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      (latitude === 0 && longitude === 0)
    ) {
      console.warn(
        `[getNearbyProfiles] refusing to search from suspicious coords (${latitude}, ${longitude}). ` +
        `Check locationService.getCurrentLocation() output.`
      );
      return [];
    }
    console.log(
      `[getNearbyProfiles] searching around (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) radius=${radiusInKm}km`
    );

    try {
      // Bug #3: query only the 3x3 geohash tile block around the user instead of
      // downloading the whole profiles collection. Requires ".indexOn": ["geohash"].
      const ranges = neighborPrefixRanges(latitude, longitude, radiusInKm);
      const snapshots = await Promise.all(
        ranges.map(([start, end]) =>
          get(
            query(
              ref(rtdb, 'profiles'),
              orderByChild('geohash'),
              startAt(start),
              endAt(end)
            )
          )
        )
      );

      const merged = new Map<string, Profile>();
      for (const snap of snapshots) {
        const val = snap.val() as Record<string, Profile> | null;
        if (!val) continue;
        for (const [uid, profile] of Object.entries(val)) {
          if (!merged.has(uid)) merged.set(uid, { ...profile, uid: profile.uid ?? uid });
        }
      }

      let candidates = Array.from(merged.values());
      console.log(
        `[getNearbyProfiles] geohash query returned ${candidates.length} candidates ` +
        `across ${ranges.length} tiles (radius ${radiusInKm}km)`
      );

      // Fallback: if nothing matched by geohash (e.g. legacy profiles missing the
      // field), scan the whole collection once so the app keeps working while a
      // backfill is pending. Remove once all profiles have a geohash.
      if (candidates.length === 0) {
        console.warn(
          '[getNearbyProfiles] no geohash matches — falling back to full scan. ' +
          'Run scripts/backfill-geohash.js to migrate existing profiles.'
        );
        const snapshot = await get(ref(rtdb, 'profiles'));
        if (!snapshot.val()) return [];
        candidates = Object.values(snapshot.val() as Record<string, Profile>);
      }

      const nearby = candidates.filter((profile) => {
        const loc = profile.location;
        if (
          !loc ||
          typeof loc.latitude !== 'number' ||
          typeof loc.longitude !== 'number' ||
          !Number.isFinite(loc.latitude) ||
          !Number.isFinite(loc.longitude)
        ) {
          return false;
        }
        const distance = this.calculateDistance(
          latitude,
          longitude,
          loc.latitude,
          loc.longitude
        );
        return distance <= radiusInKm;
      });

      console.log(`Found ${nearby.length} nearby profiles within ${radiusInKm}km`);
      return nearby;
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] getNearbyProfiles', error);
      } else {
        console.error('Error fetching nearby profiles:', error);
      }
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

  async saveLike(
    userId: string,
    targetId: string
  ): Promise<{ isMatch: boolean; matchId?: string }> {
    const now = Date.now();
    try {
      await set(ref(rtdb, `profiles/${userId}/sent_likes/${targetId}`), {
        createdAt: now,
        targetId,
      });
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] saveLike', { userId, targetId }, error);
      } else {
        console.error('Error saving like:', error);
      }
      throw error;
    }

    // Notify the target that they received a like (best-effort, non-blocking).
    try {
      await set(ref(rtdb, `profiles/${targetId}/received_likes/${userId}`), {
        createdAt: now,
        senderId: userId,
      });
    } catch (err: any) {
      console.warn('[saveLike] received_likes write failed (non-blocking):', err?.code || err);
    }

    // Detect reciprocal like → create match.
    try {
      const reciprocal = await get(
        ref(rtdb, `profiles/${targetId}/sent_likes/${userId}`)
      );
      if (reciprocal.exists()) {
        const match = await matchService.createMatch(userId, targetId);
        return { isMatch: true, matchId: match.id };
      }
    } catch (err: any) {
      console.warn('[saveLike] reciprocal check failed (non-blocking):', err?.code || err);
    }

    return { isMatch: false };
  }

  async saveNope(userId: string, targetId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/nopes/${targetId}`), {
        createdAt: Date.now(),
        targetId,
      });
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] saveNope', { userId, targetId }, error);
      } else {
        console.error('Error saving nope:', error);
      }
      throw error;
    }
  }

  async saveFavorite(userId: string, targetId: string): Promise<void> {
    try {
      await set(ref(rtdb, `profiles/${userId}/favorites/${targetId}`), {
        createdAt: Date.now(),
        targetId,
      });
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] saveFavorite', { userId, targetId }, error);
      } else {
        console.error('Error saving favorite:', error);
      }
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

  async saveBlock(userId: string, targetId: string): Promise<void> {
    const now = Date.now();
    const blockId = `${userId}_${targetId}`;
    try {
      await set(ref(rtdb, `blocks/${blockId}`), {
        blockerId: userId,
        blockedId: targetId,
        createdAt: now,
      });
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] saveBlock', { userId, targetId }, error);
      } else {
        console.error('Error saving block:', error);
      }
      throw error;
    }
  }

  async unblock(userId: string, targetId: string): Promise<void> {
    const blockId = `${userId}_${targetId}`;
    try {
      const blockRef = ref(rtdb, `blocks/${blockId}`);
      const snapshot = await get(blockRef);

      if (snapshot.exists()) {
        const block = snapshot.val();
        if (block.blockerId === userId && block.blockedId === targetId) {
          await set(blockRef, null);
        }
      }
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] unblock', { userId, targetId }, error);
      } else {
        console.error('Error unblocking:', error);
      }
      throw error;
    }
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    try {
      const blockId = `${userId}_${targetId}`;
      const snapshot = await get(ref(rtdb, `blocks/${blockId}`));
      if (snapshot.exists()) {
        const block = snapshot.val();
        return block.blockerId === userId && block.blockedId === targetId;
      }
      return false;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  }
}

export const userService = new UserService();
