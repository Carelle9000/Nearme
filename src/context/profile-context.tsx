import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../models/user';
import { photoService } from '../services/photo.service';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';

interface ProfileContextType {
  profilePhotos: string[];
  isUploadingPhoto: boolean;
  isSavingProfile: boolean;
  error: string | null;

  pickAndUploadPhoto: () => Promise<boolean>;
  takeAndUploadPhoto: () => Promise<boolean>;
  deletePhoto: (photoUrl: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  reorderPhotos: (newOrder: string[]) => Promise<void>;
  clearError: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profilePhotos, setProfilePhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user photos on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      setProfilePhotos(user.photos || []);
      setError(null);
    } else {
      // Clear photos when user logs out
      setProfilePhotos([]);
      setError(null);
      setIsUploadingPhoto(false);
      setIsSavingProfile(false);
    }
  }, [user?.id, user?.photos]);

  const pickAndUploadPhoto = async (): Promise<boolean> => {
    if (!user?.id) return false;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const imageUri = await photoService.pickImage();
      if (!imageUri) return false;

      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      const updatedPhotos = [...(profilePhotos || []), photoUrl];
      setProfilePhotos(updatedPhotos);

      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: updatedPhotos,
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Impossible de télécharger la photo');
      console.error('Error uploading photo:', err);
      return false;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const takeAndUploadPhoto = async (): Promise<boolean> => {
    if (!user?.id) return false;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const imageUri = await photoService.takePhoto();
      if (!imageUri) return false;

      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      const updatedPhotos = [...(profilePhotos || []), photoUrl];
      setProfilePhotos(updatedPhotos);

      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: updatedPhotos,
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Impossible de prendre une photo');
      console.error('Error taking photo:', err);
      return false;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const deletePhoto = async (photoUrl: string) => {
    if (!user?.id) return;

    try {
      await photoService.deletePhoto(photoUrl);
      const updatedPhotos = profilePhotos.filter((p) => p !== photoUrl);
      setProfilePhotos(updatedPhotos);

      // Update user profile
      await userService.updateProfile(user.id, {
        photos: updatedPhotos,
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer la photo');
      console.error('Error deleting photo:', err);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return;

    setIsSavingProfile(true);
    setError(null);
    try {
      await userService.updateProfile(user.id, updates);
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour le profil');
      console.error('Error updating profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const reorderPhotos = async (newOrder: string[]) => {
    if (!user?.id) return;

    setProfilePhotos(newOrder);
    try {
      await userService.updateProfile(user.id, {
        photos: newOrder,
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de réorganiser les photos');
      console.error('Error reordering photos:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        profilePhotos,
        isUploadingPhoto,
        isSavingProfile,
        error,
        pickAndUploadPhoto,
        takeAndUploadPhoto,
        deletePhoto,
        updateProfile,
        reorderPhotos,
        clearError,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile doit être utilisé dans ProfileProvider');
  }
  return context;
}
