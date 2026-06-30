import { locationService } from './location.service';
import { userService } from './user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  async startLocationSync(userId: string): Promise<void> {
    if (this.syncInterval) {
      return; // Already syncing
    }

    // Sync immediately
    await this.syncLocationOnce(userId);

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.syncLocationOnce(userId);
    }, this.SYNC_INTERVAL_MS);
  }

  stopLocationSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncLocationOnce(userId: string): Promise<void> {
    try {
      const now = Date.now();

      // Check if enough time has passed since last sync
      if (now - this.lastSyncTime < this.SYNC_INTERVAL_MS) {
        return;
      }

      const location = await locationService.getCurrentLocation();
      if (!location) {
        console.warn('Failed to get current location for sync');
        return;
      }

      // Get city name
      const city = await locationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );

      // Update user profile with new location
      await userService.updateProfile(userId, {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          city: city || undefined,
        },
      });

      this.lastSyncTime = now;

      // Store last sync time in local storage
      await AsyncStorage.setItem('lastLocationSync', now.toString());
    } catch (error) {
      console.error('Error syncing location:', error);
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const lastSync = await AsyncStorage.getItem('lastLocationSync');
      return lastSync ? parseInt(lastSync, 10) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }
}

export const locationSyncService = new LocationSyncService();
