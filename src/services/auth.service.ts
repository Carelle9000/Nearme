import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
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

    const appUser: AppUser = {
      id: uid,
      name,
      email,
      createdAt: new Date(),
      verified: false,
    };

    // Create profile document in Firestore
    await setDoc(doc(db, 'profiles', uid), {
      ...appUser,
      createdAt: serverTimestamp(),
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
      const userCred = await signInWithEmailAndPassword(auth, email, password);
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
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as Profile;
        this.cachedUser = {
          id: user.uid,
          name: profileData.name || user.displayName || '',
          email: user.email || '',
          displayName: profileData.displayName,
          photoUrl: profileData.photoUrl,
          birthDate: profileData.birthDate ? new Date(profileData.birthDate) : undefined,
          gender: profileData.gender,
          bio: profileData.bio,
          interests: profileData.interests,
          location: profileData.location,
          createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
          verified: user.emailVerified,
          isAgeVerified: profileData.isAgeVerified,
        };
      } else {
        this.cachedUser = {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          createdAt: new Date(),
          verified: user.emailVerified,
        };
      }
      this.checkAgeVerificationNeeded();
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.cachedUser = null;
      throw new Error('Failed to load user profile');
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
    } finally {
      this.cachedUser = null;
      this.needsAgeVerification = false;
      this.loginAttempts = 0;
      this.lastLoginAttempt = 0;
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
    await setDoc(doc(db, 'profiles', uid), updates, { merge: true });
    if (this.cachedUser?.id === uid) {
      await this.loadCurrentUser();
    }
  }
}

export const authService = new AuthService();
