import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser } from '../models/user';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  needsAgeVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.setupAuthListener((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Initial load
    authService.loadCurrentUser().then(() => {
      setUser(authService.currentUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.login(email, password);
      setUser(authService.currentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await authService.register(email, password, name);
      setUser(authService.currentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;
    await authService.updateUserProfile(user.id, updates as any);
    setUser(authService.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: authService.isLoggedIn,
        needsAgeVerification: authService.needsAgeVerify,
        login,
        register,
        logout,
        updateProfile,
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
