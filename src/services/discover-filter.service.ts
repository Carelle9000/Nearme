import { Profile } from '../models/user';
import { DiscoverFilters } from '../context/discover-filters-context';

class DiscoverFilterService {
  filterProfiles(profiles: Profile[], filters: DiscoverFilters, currentUserId: string): Profile[] {
    return profiles.filter((profile) => {
      // Exclude current user
      if (profile.uid === currentUserId) {
        return false;
      }

      // Age filtering
      if (profile.birthDate) {
        const age = this.calculateAge(new Date(profile.birthDate));
        if (age < filters.minAge || age > filters.maxAge) {
          return false;
        }
      }

      // Gender filtering
      if (filters.gender && filters.gender !== 'all') {
        if (profile.gender !== filters.gender) {
          return false;
        }
      }

      // Distance filtering (if location available)
      if (profile.location && filters.maxDistance) {
        // Distance would be calculated by the caller, but we verify location exists
        if (!profile.location.latitude || !profile.location.longitude) {
          return false;
        }
      }

      // Interests filtering (optional - profile must have at least one matching interest)
      if (filters.interests.length > 0 && profile.interests) {
        const hasMatchingInterest = filters.interests.some((interest) =>
          profile.interests?.includes(interest)
        );
        if (!hasMatchingInterest) {
          // If interests are specified but no match, exclude
          // Remove this check if you want interests to be optional
          return true; // For now, we allow all if no common interests
        }
      }

      return true;
    });
  }

  sortProfilesByDistance(
    profiles: Profile[],
    userLat: number,
    userLon: number
  ): Profile[] {
    const withDistance = profiles.map((profile) => ({
      ...profile,
      distance: this.calculateDistance(
        userLat,
        userLon,
        profile.location?.latitude || 0,
        profile.location?.longitude || 0
      ),
    }));

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...profile }) => profile);
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const discoverFilterService = new DiscoverFilterService();
