import {
  ref,
  set,
  get,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { rtdb } from '../config/firebase';
import { Match } from '../models/user';

function pairIds(a: string, b: string): [string, string] {
  const sorted = [a, b].sort();
  return [sorted[0], sorted[1]];
}

function matchIdFor(a: string, b: string): string {
  const [u1, u2] = pairIds(a, b);
  return `${u1}_${u2}`;
}

class MatchService {
  async createMatch(userA: string, userB: string): Promise<Match> {
    const [userId1, userId2] = pairIds(userA, userB);
    const matchId = `${userId1}_${userId2}`;
    const now = Date.now();

    try {
      await set(ref(rtdb, `matches/${matchId}`), {
        userId1,
        userId2,
        matchedAt: now,
      });
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        console.error('[RTDB-DENY] createMatch', { matchId }, error);
      } else {
        console.error('Error creating match:', error);
      }
      throw error;
    }

    return {
      id: matchId,
      users: [userId1, userId2],
      matchedAt: new Date(now),
    };
  }

  async checkMatch(userA: string, userB: string): Promise<boolean> {
    try {
      const snapshot = await get(ref(rtdb, `matches/${matchIdFor(userA, userB)}`));
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking match:', error);
      return false;
    }
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const [asUser1Snap, asUser2Snap] = await Promise.all([
        get(query(ref(rtdb, 'matches'), orderByChild('userId1'), equalTo(userId))),
        get(query(ref(rtdb, 'matches'), orderByChild('userId2'), equalTo(userId))),
      ]);

      const raw: Record<string, any> = {
        ...(asUser1Snap.val() || {}),
        ...(asUser2Snap.val() || {}),
      };

      return Object.entries(raw).map(([id, data]: any) => ({
        id,
        users: [data.userId1, data.userId2],
        matchedAt: new Date(data.matchedAt),
        lastInteractionAt: data.lastInteractionAt
          ? new Date(data.lastInteractionAt)
          : undefined,
      }));
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
