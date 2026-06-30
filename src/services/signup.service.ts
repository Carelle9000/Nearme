import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { SignupData } from '../context/signup-context';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  birthYear: number;
  gender: string;
  city: string;
  bio: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profileCompleted: boolean;
  age?: number;
}

export const signupService = {
  /**
   * Create user account with email and password
   */
  async createAccount(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Create user profile in Firestore
   */
  async createProfile(userId: string, signupData: SignupData): Promise<UserProfile> {
    try {
      const birthYear = parseInt(signupData.birthYear, 10);
      const now = Timestamp.now();

      const profileData: UserProfile = {
        uid: userId,
        email: signupData.email,
        firstName: signupData.firstName,
        birthYear,
        gender: signupData.gender,
        city: signupData.city,
        bio: signupData.bio,
        createdAt: now,
        updatedAt: now,
        profileCompleted: true,
        age: new Date().getFullYear() - birthYear,
      };

      await setDoc(doc(db, 'users', userId), profileData);
      return profileData;
    } catch (error: any) {
      throw new Error('Failed to create profile: ' + error.message);
    }
  },

  /**
   * Update user display name in Firebase Auth
   */
  async updateDisplayName(user: User, firstName: string): Promise<void> {
    try {
      await updateProfile(user, { displayName: firstName });
    } catch (error: any) {
      throw new Error('Failed to update display name: ' + error.message);
    }
  },

  /**
   * Get user profile from Firestore
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error: any) {
      throw new Error('Failed to get profile: ' + error.message);
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error('Failed to update profile: ' + error.message);
    }
  },

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to logout: ' + error.message);
    }
  },

  /**
   * Verify user age (must be 18+)
   */
  isAgeValid(birthYear: number): boolean {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return age >= 18;
  },

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  getErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'This email is already in use. Please log in or use a different email.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many login attempts. Please try again later.',
      'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
      'auth/invalid-credential': 'Invalid email or password.',
    };

    return errorMessages[code] || 'An error occurred. Please try again.';
  },
};
