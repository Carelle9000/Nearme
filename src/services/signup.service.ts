import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';
import { SignupData } from '../context/signup-context';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  birthYear: number;
  gender: string;
  city: string;
  createdAt: number;
  updatedAt: number;
  profileCompleted: boolean;
  age?: number;
  interests?: string[];
  photos?: string[];
  bio?: string;
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
   * Create user profile in Realtime Database
   */
  async createProfile(userId: string, signupData: SignupData): Promise<UserProfile> {
    try {
      const birthYear = parseInt(signupData.birthYear, 10);
      const now = Date.now();

      // Validate age before creating profile
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (age < 18) {
        throw new Error('Users must be at least 18 years old');
      }

      const profileData: UserProfile = {
        uid: userId,
        email: signupData.email,
        firstName: signupData.firstName,
        birthYear,
        gender: signupData.gender,
        city: signupData.city,
        bio: signupData.bio,
        interests: signupData.interests || [],
        photos: (signupData as any).photos || [],
        createdAt: now,
        updatedAt: now,
        profileCompleted: true,
      };

      await set(ref(rtdb, `profiles/${userId}`), profileData);
      return profileData;
    } catch (error: any) {
      const message = error.message.includes('permission')
        ? 'Vous n\'avez pas la permission de créer un profil'
        : 'Erreur lors de la création du profil. Veuillez réessayer.';
      throw new Error(message);
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
   * Get user profile from Realtime Database
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const snapshot = await get(ref(rtdb, `profiles/${userId}`));
      return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
    } catch (error: any) {
      throw new Error('Failed to get profile: ' + error.message);
    }
  },

  /**
   * Update user profile in Realtime Database
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await update(ref(rtdb, `profiles/${userId}`), {
        ...updates,
        updatedAt: Date.now(),
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
   * Validate password strength (12+ chars with complexity)
   */
  isPasswordStrong(password: string): { valid: boolean; reason?: string } {
    if (password.length < 12) {
      return { valid: false, reason: 'Le mot de passe doit contenir au moins 12 caractères.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, reason: 'Le mot de passe doit contenir au moins une minuscule.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, reason: 'Le mot de passe doit contenir au moins une majuscule.' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, reason: 'Le mot de passe doit contenir au moins un chiffre.' };
    }
    if (!/[@$!%*?&#]/.test(password)) {
      return { valid: false, reason: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&#).' };
    }
    return { valid: true };
  },

  /**
   * Validate email format
   */
  isEmailValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  getErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cet email est déjà utilisé. Veuillez vous connecter ou utiliser une autre adresse.',
      'auth/invalid-email': 'Veuillez entrer une adresse email valide.',
      'auth/weak-password': 'Le mot de passe doit contenir 12+ caractères avec minuscules, majuscules, chiffres et symboles.',
      'auth/user-not-found': 'Identifiants invalides. Veuillez réessayer.',
      'auth/wrong-password': 'Identifiants invalides. Veuillez réessayer.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
      'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée. Veuillez contacter le support.',
      'auth/invalid-credential': 'Identifiants invalides. Veuillez réessayer.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion Internet.',
      'auth/service-disabled': 'Le service d\'authentification est temporairement indisponible.',
      'auth/invalid-api-key': 'Configuration invalide. Veuillez contacter le support.',
      'auth/app-not-authorized': 'L\'application n\'est pas autorisée. Veuillez contacter le support.',
      'auth/invalid-user-token': 'Votre session a expiré. Veuillez vous reconnecter.',
      'auth/user-token-expired': 'Votre session a expiré. Veuillez vous reconnecter.',
      'auth/null-user': 'Aucun utilisateur connecté.',
      'auth/internal-error': 'Erreur interne. Veuillez réessayer.',
    };

    return errorMessages[code] || 'Une erreur s\'est produite. Veuillez réessayer.';
  },
};
