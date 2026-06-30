import React, { createContext, useContext, useState } from 'react';
import { Profile } from '../models/user';
import { photoService } from '../services/photo.service';
import { userService } from '../services/user.service';
import { useAuth } from './auth-context';

interface ProfileContextType {
  profilePhotos: string[];
  isUploadingPhoto: boolean;
  isSavingProfile: boolean;
  error: string | null;

  pickAndUploadPhoto: () => Promise<void>;
  takeAndUploadPhoto: () => Promise<void>;
  deletePhoto: (photoUrl: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  reorderPhotos: (newOrder: string[]) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profilePhotos, setProfilePhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUploadPhoto = async () => {
    if (!user?.id) return;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const imageUri = await photoService.pickImage();
      if (!imageUri) return;

      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      setProfilePhotos((prev) => [...prev, photoUrl]);

      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: [...profilePhotos, photoUrl],
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de télécharger la photo');
      console.error('Error uploading photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const takeAndUploadPhoto = async () => {
    if (!user?.id) return;

    setIsUploadingPhoto(true);
    setError(null);
    try {
      const imageUri = await photoService.takePhoto();
      if (!imageUri) return;

      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      setProfilePhotos((prev) => [...prev, photoUrl]);

      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: [...profilePhotos, photoUrl],
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de prendre une photo');
      console.error('Error taking photo:', err);
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
