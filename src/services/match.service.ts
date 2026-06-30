import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Match } from '../models/user';

class MatchService {
  async createMatch(userId1: string, userId2: string): Promise<Match> {
    const matchId = [userId1, userId2].sort().join('_');

    const match: Match = {
      id: matchId,
      users: [userId1, userId2],
      matchedAt: new Date(),
    };

    await setDoc(doc(db, 'matches', matchId), {
      ...match,
      matchedAt: serverTimestamp(),
    });

    return match;
  }

  async checkMatch(userId1: string, userId2: string): Promise<boolean> {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'matches'), where('users', 'array-contains', userId1))
      );

      return snapshot.docs.some(
        (doc) => doc.data().users.includes(userId1) && doc.data().users.includes(userId2)
      );
    } catch (error) {
      console.error('Error checking match:', error);
      return false;
    }
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    try {
      const q = query(
        collection(db, 'matches'),
        where('users', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as Match),
        matchedAt: doc.data().matchedAt?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('Error fetching user matches:', error);
      throw error;
    }
  }

  getOtherUserId(match: Match, currentUserId: string): string {
    return match.users.find((id) => id !== currentUserId) || '';
  }
}

export const matchService = new MatchService();
