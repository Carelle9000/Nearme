import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';
import { AppUser, Profile } from '../models/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private cachedUser: AppUser | null = null;
  private needsAgeVerification = false;
  private loginAttempts = 0;
  private lastLoginAttempt = 0;

  async register(email: string, password: string, name: string): Promise<AppUser> {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const now = new Date();
    const trialExpiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const appUser: AppUser = {
      id: uid,
      name,
      email,
      createdAt: now,
      verified: false,
      premium: {
        isActive: true,
        tier: 'trial',
        startDate: now.toISOString(),
        expiryDate: trialExpiryDate.toISOString(),
      },
    };

    // Create profile in Realtime Database
    await set(ref(rtdb, `profiles/${uid}`), {
      ...appUser,
      uid, // Required by Firebase validation rules
      createdAt: now.getTime(),
    });

    this.cachedUser = appUser;
    return appUser;
  }

  async login(email: string, password: string): Promise<AppUser> {
    const now = Date.now();
    const delayMs = 1000 * Math.pow(2, this.loginAttempts);

    if (now - this.lastLoginAttempt < delayMs && this.loginAttempts > 0) {
      throw new Error('auth/too-many-requests');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      this.loginAttempts = 0;
      this.lastLoginAttempt = 0;
      await this.loadCurrentUser();
      return this.cachedUser!;
    } catch (error) {
      this.loginAttempts++;
      this.lastLoginAttempt = now;
      throw error;
    }
  }

  async loadCurrentUser(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      this.cachedUser = null;
      this.needsAgeVerification = false;
      return;
    }

    try {
      const snapshot = await get(ref(rtdb, `profiles/${user.uid}`));
      if (snapshot.exists()) {
        const profileData = snapshot.val() as Profile;

        // Ensure existing users have premium/trial data
        // If they don't have premium data, they should get a 7-day trial
        let premium = profileData.premium;
        if (!premium) {
          console.log(`[Migration] No premium data for user ${user.uid}, assigning 7-day trial`);
          const now = new Date();
          const trialExpiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          premium = {
            isActive: true,
            tier: 'trial',
            startDate: now.toISOString(),
            expiryDate: trialExpiryDate.toISOString(),
          };
          // Update the profile with trial data
          await set(ref(rtdb, `profiles/${user.uid}/premium`), premium);
        }

        this.cachedUser = {
          id: user.uid,
          name: profileData.name || user.displayName || '',
          email: user.email || '',
          displayName: profileData.displayName,
          photoUrl: profileData.photoUrl,
          photos: profileData.photos,
          birthDate: profileData.birthDate ? new Date(profileData.birthDate) : undefined,
          gender: profileData.gender,
          bio: profileData.bio,
          interests: profileData.interests,
          location: profileData.location,
          createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
          verified: user.emailVerified,
          isAgeVerified: profileData.isAgeVerified,
          premium,
          analytics: profileData.analytics,
        };
      } else {
        // Profile doesn't exist yet (new user) - use Auth data and create trial
        const now = new Date();
        const trialExpiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        this.cachedUser = {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          photos: [],
          createdAt: new Date(),
          verified: user.emailVerified,
          premium: {
            isActive: true,
            tier: 'trial',
            startDate: now.toISOString(),
            expiryDate: trialExpiryDate.toISOString(),
          },
        };
      }
      this.checkAgeVerificationNeeded();
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      // If RTDB read fails, still create a minimal user object from Auth
      // This allows users to proceed even if profile is not yet created
      const now = new Date();
      const trialExpiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      this.cachedUser = {
        id: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        photos: [],
        createdAt: new Date(),
        verified: user.emailVerified,
        premium: {
          isActive: true,
          tier: 'trial',
          startDate: now.toISOString(),
          expiryDate: trialExpiryDate.toISOString(),
        },
      };
      this.checkAgeVerificationNeeded();
    }
  }

  private checkAgeVerificationNeeded(): void {
    if (!this.cachedUser?.birthDate) {
      this.needsAgeVerification = false;
      return;
    }

    const age = this.calculateAge(this.cachedUser.birthDate);
    this.needsAgeVerification = age < 20 && !this.cachedUser.isAgeVerified;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.cachedUser = null;
      this.needsAgeVerification = false;
      this.loginAttempts = 0;
      this.lastLoginAttempt = 0;
    } catch (error: any) {
      console.error('Error signing out:', error);
      this.cachedUser = null;
      this.needsAgeVerification = false;
      this.loginAttempts = 0;
      this.lastLoginAttempt = 0;
      throw new Error(this.getErrorMessage(error.code || 'unknown'));
    }
  }

  setupAuthListener(callback: (user: AppUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.loadCurrentUser();
        callback(this.cachedUser);
      } else {
        this.cachedUser = null;
        callback(null);
      }
    });
  }

  get currentUser(): AppUser | null {
    return this.cachedUser;
  }

  get isLoggedIn(): boolean {
    return auth.currentUser !== null;
  }

  get needsAgeVerify(): boolean {
    return this.needsAgeVerification;
  }

  async updateUserProfile(uid: string, updates: Partial<Profile>): Promise<void> {
    try {
      // Get current profile and merge
      const snapshot = await get(ref(rtdb, `profiles/${uid}`));
      const currentProfile = snapshot.val() || {};

      await set(ref(rtdb, `profiles/${uid}`), {
        ...currentProfile,
        uid, // Ensure uid is always present for validation
        ...updates,
      });

      if (this.cachedUser?.id === uid) {
        await this.loadCurrentUser();
      }
    } catch (error: any) {
      if (error?.code === 'PERMISSION_DENIED') {
        throw new Error(this.getErrorMessage('PERMISSION_DENIED'));
      }
      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async verifyResetCode(oobCode: string): Promise<string | null> {
    try {
      return await verifyPasswordResetCode(auth, oobCode);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async saveRememberMe(email: string, remember: boolean): Promise<void> {
    if (remember) {
      await AsyncStorage.setItem('rememberMe_email', email);
    } else {
      await AsyncStorage.removeItem('rememberMe_email');
    }
  }

  async getRememberedEmail(): Promise<string | null> {
    return await AsyncStorage.getItem('rememberMe_email');
  }

  async clearRememberMe(): Promise<void> {
    await AsyncStorage.removeItem('rememberMe_email');
  }

  private getErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse.',
      'auth/invalid-oob-code': 'Le lien de réinitialisation est invalide ou expiré.',
      'auth/operation-not-allowed': 'La réinitialisation de mot de passe n\'est pas activée.',
      'auth/weak-password': 'Le nouveau mot de passe est trop faible.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/requires-recent-login': 'Veuillez vous déconnecter et reconnecter avant de supprimer votre compte.',
      'PERMISSION_DENIED': 'Vous n\'avez pas la permission de modifier votre profil. Veuillez vous reconnecter.',
      'unknown': 'Une erreur inconnue s\'est produite. Veuillez réessayer.',
    };

    return errorMessages[code] || 'Une erreur s\'est produite. Veuillez réessayer.';
  }
}

export const authService = new AuthService();
