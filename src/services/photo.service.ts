import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
      if (!hasPermission) {
        throw new Error('Permissions pour la galerie non accordées');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('Aucune image sélectionnée');
      }

      return result.assets[0].uri;
    } catch (error: any) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissions pour la caméra non accordées');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('Impossible de capturer la photo');
      }

      return result.assets[0].uri;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  async uploadProfilePhoto(userId: string, imageUri: string): Promise<string> {
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }

    if (!imageUri) {
      throw new Error('URI de l\'image manquante');
    }

    try {
      console.log('Converting image to blob...');
      const blob = await this.uriToBlob(imageUri);
      console.log('Blob size:', blob.size);

      const fileName = `profile_${Date.now()}.jpg`;
      const storageRef = ref(storage, `photos/${userId}/${fileName}`);

      console.log('Uploading to Firebase Storage...');
      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      console.log('Upload successful:', uploadResult.metadata.fullPath);

      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      throw new Error(error.message || 'Erreur lors du téléchargement de la photo');
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
    try {
      // For Expo, read the file using FileSystem
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting URI to Blob:', error);
      throw new Error('Impossible de traiter l\'image. Veuillez réessayer.');
    }
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
