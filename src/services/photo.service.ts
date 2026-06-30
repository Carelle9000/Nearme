import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

class PhotoService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting photo permissions:', error);
      return false;
    }
  }

  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return null;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    try {
      const blob = await this.uriToBlob(imageUri);
      const storageRef = ref(storage, `photos/${userId}/profile/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async uploadChatPhoto(conversationId: string, userId: string, imageUri: string): Promise<string> {
    try {
      const blob = await this.uriToBlob(imageUri);
      const storageRef = ref(
        storage,
        `chats/${conversationId}/${userId}/${Date.now()}`
      );
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading chat photo:', error);
      throw error;
    }
  }

  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }

  async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract the path from the download URL
      const pathMatch = photoUrl.match(/\/o\/(.*?)\?/);
      if (!pathMatch || !pathMatch[1]) {
        throw new Error('Invalid photo URL');
      }

      const decodedPath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
