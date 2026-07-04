import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { rtdb } from '../config/firebase';

class BlockService {
  private blockCache = new Map<string, Set<string>>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getBlockedByMe(userId: string): Promise<Set<string>> {
    const now = Date.now();
    const expiry = this.cacheExpiry.get(userId) || 0;

    // Return from cache if valid
    if (this.blockCache.has(userId) && now < expiry) {
      console.log(`[BlockService] Cache hit for blocked profiles of ${userId}`);
      return this.blockCache.get(userId)!;
    }

    try {
      const snapshot = await get(
        query(
          ref(rtdb, 'blocks'),
          orderByChild('blockerId'),
          equalTo(userId)
        )
      );
      if (!snapshot.val()) {
        const empty = new Set<string>();
        this.blockCache.set(userId, empty);
        this.cacheExpiry.set(userId, now + this.CACHE_TTL);
        return empty;
      }

      const blocks = snapshot.val() as Record<string, any>;
      const blocked = new Set(
        Object.values(blocks).map((block: any) => block.blockedId)
      );

      // Cache the result
      this.blockCache.set(userId, blocked);
      this.cacheExpiry.set(userId, now + this.CACHE_TTL);

      console.log(`[BlockService] Loaded and cached ${blocked.size} blocked profiles for ${userId}`);
      return blocked;
    } catch (error) {
      console.error('[BlockService] Error loading blocked profiles:', error);
      return new Set();
    }
  }

  async isBlockedBy(blockerId: string, targetId: string): Promise<boolean> {
    try {
      const blockId = `${blockerId}_${targetId}`;
      const snapshot = await get(ref(rtdb, `blocks/${blockId}`));
      if (!snapshot.exists()) return false;

      const block = snapshot.val();
      return (
        block.blockerId === blockerId &&
        block.blockedId === targetId
      );
    } catch (error) {
      console.error('[BlockService] Error checking if blocked by:', error);
      return false;
    }
  }

  invalidateCache(userId: string): void {
    console.log(`[BlockService] Invalidating cache for ${userId}`);
    this.blockCache.delete(userId);
    this.cacheExpiry.delete(userId);
  }

  clearAllCache(): void {
    console.log('[BlockService] Clearing all cache');
    this.blockCache.clear();
    this.cacheExpiry.clear();
  }
}

export const blockService = new BlockService();
