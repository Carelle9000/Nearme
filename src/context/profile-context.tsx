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
  const [profilePhotos, setProfilePhotos] = useState<string[]>(user?.photos || []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync photos when user changes
  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfilePhotos(user.photos || []);
      setError(null);
    } else {
      // Clear photos when user logs out
       
      setProfilePhotos([]);
      setError(null);
      setIsUploadingPhoto(false);
      setIsSavingProfile(false);
    }
  }, [user?.id]);

  const pickAndUploadPhoto = async (): Promise<boolean> => {
    console.log('pickAndUploadPhoto: user.id=', user?.id);
    if (!user?.id) {
      const msg = 'Vous devez être connecté pour télécharger une photo';
      setError(msg);
      return false;
    }

    setIsUploadingPhoto(true);
    setError(null);
    try {
      console.log('Picking image...');
      const imageUri = await photoService.pickImage();
      console.log('Image URI:', imageUri);
      if (!imageUri) {
        const msg = 'Aucune image sélectionnée';
        setError(msg);
        return false;
      }

      console.log('Uploading photo to Firebase Storage...');
      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      console.log('Photo uploaded successfully:', photoUrl);
      const updatedPhotos = [...(profilePhotos || []), photoUrl];
      setProfilePhotos(updatedPhotos);

      console.log('Updating user profile with photos...');
      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: updatedPhotos,
        photoUrl: updatedPhotos[0], // Set first photo as profile photo
      });
      console.log('Profile updated successfully');
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Impossible de télécharger la photo';
      setError(errorMsg);
      console.error('Error uploading photo:', err);
      return false;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const takeAndUploadPhoto = async (): Promise<boolean> => {
    console.log('takeAndUploadPhoto: user.id=', user?.id);
    if (!user?.id) {
      setError('Vous devez être connecté');
      return false;
    }

    setIsUploadingPhoto(true);
    setError(null);
    try {
      console.log('Taking photo...');
      const imageUri = await photoService.takePhoto();
      console.log('Photo URI:', imageUri);
      if (!imageUri) {
        setError('Prise de photo annulée');
        return false;
      }

      console.log('Uploading photo...');
      const photoUrl = await photoService.uploadProfilePhoto(user.id, imageUri);
      console.log('Photo uploaded:', photoUrl);
      const updatedPhotos = [...(profilePhotos || []), photoUrl];
      setProfilePhotos(updatedPhotos);

      // Update user profile with new photos
      await userService.updateProfile(user.id, {
        photos: updatedPhotos,
      });
      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Impossible de prendre une photo';
      setError(errorMsg);
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
