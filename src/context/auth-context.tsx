import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppUser } from '../models/user';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  needsAgeVerification: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<void>;
  verifyResetCode: (oobCode: string) => Promise<string | null>;
  getRememberedEmail: () => Promise<string | null>;
  clearRememberMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsAgeVerif, setNeedsAgeVerif] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.setupAuthListener((currentUser) => {
      setUser(currentUser);
      setNeedsAgeVerif(authService.needsAgeVerify);
      setIsLoading(false);
    });

    // Initial load
    authService.loadCurrentUser().then(() => {
      setUser(authService.currentUser);
      setNeedsAgeVerif(authService.needsAgeVerify);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Failed to load current user:', error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      await authService.login(email, password);
      if (rememberMe) {
        await authService.saveRememberMe(email, true);
      } else {
        await authService.clearRememberMe();
      }
      setUser(authService.currentUser);
      setNeedsAgeVerif(authService.needsAgeVerify);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await authService.register(email, password, name);
      setUser(authService.currentUser);
      setNeedsAgeVerif(authService.needsAgeVerify);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('Auth context: Starting logout');
    setIsLoading(true);
    try {
      console.log('Auth context: Calling authService.logout()');
      await authService.logout();
      console.log('Auth context: authService.logout() completed');
      setUser(null);
      setNeedsAgeVerif(false);
      console.log('Auth context: User state cleared');
    } catch (error: any) {
      console.error('Auth context: Error during logout:', error);
      // Still clear the user even if logout fails
      setUser(null);
      setNeedsAgeVerif(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AppUser>) => {
    if (!user) return;
    await authService.updateUserProfile(user.id, updates as any);
    setUser(authService.currentUser);
    setNeedsAgeVerif(authService.needsAgeVerify);
  }, [user]);

  const sendPasswordReset = useCallback(async (email: string) => {
    await authService.sendPasswordReset(email);
  }, []);

  const resetPassword = useCallback(async (oobCode: string, newPassword: string) => {
    await authService.resetPassword(oobCode, newPassword);
  }, []);

  const verifyResetCode = useCallback(async (oobCode: string) => {
    return await authService.verifyResetCode(oobCode);
  }, []);

  const getRememberedEmail = useCallback(async () => {
    return await authService.getRememberedEmail();
  }, []);

  const clearRememberMe = useCallback(async () => {
    await authService.clearRememberMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: authService.isLoggedIn,
        needsAgeVerification: needsAgeVerif,
        login,
        register,
        logout,
        updateProfile,
        sendPasswordReset,
        resetPassword,
        verifyResetCode,
        getRememberedEmail,
        clearRememberMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
