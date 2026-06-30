import {
  ref,
  set,
  get,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Match } from '../models/user';

class MatchService {
  async createMatch(userId1: string, userId2: string): Promise<Match> {
    const matchId = [userId1, userId2].sort().join('_');
    const now = Date.now();

    const match: Match = {
      id: matchId,
      users: [userId1, userId2],
      matchedAt: new Date(now),
    };

    await set(ref(rtdb, `matches/${matchId}`), {
      ...match,
      matchedAt: now,
    });

    return match;
  }

  async checkMatch(userId1: string, userId2: string): Promise<boolean> {
    try {
      const matchId = [userId1, userId2].sort().join('_');
      const snapshot = await get(ref(rtdb, `matches/${matchId}`));
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking match:', error);
      return false;
    }
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const snapshot = await get(ref(rtdb, 'matches'));
      if (!snapshot.exists()) return [];

      const matchesObj = snapshot.val();
      const matches = Object.entries(matchesObj)
        .map(([id, data]: any) => ({
          id,
          ...data,
          matchedAt: new Date(data.matchedAt),
        }))
        .filter((match: any) => match.users.includes(userId));

      return matches;
    } catch (error) {
      console.error('Error fetching user matches:', error);
      return [];
    }
  }

  getOtherUserId(match: Match, currentUserId: string): string {
    return match.users.find((id) => id !== currentUserId) || '';
  }
}

export const matchService = new MatchService();
