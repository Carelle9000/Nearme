import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

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

      if (blob.size === 0) {
        throw new Error('L\'image est vide ou invalide');
      }

      const fileName = `profile_${Date.now()}.jpg`;
      const storageRef = ref(storage, `photos/${userId}/${fileName}`);

      console.log('Uploading to Firebase Storage...');
      console.log('Storage ref path:', storageRef.fullPath);

      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      console.log('Upload successful:', uploadResult.metadata.fullPath);

      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const message = this.getErrorMessage(error.code || error.message);
      throw new Error(message);
    }
  }

  private getErrorMessage(error: string): string {
    if (error.includes('permission')) {
      return 'Vous n\'avez pas la permission de télécharger des photos. Vérifiez les paramètres de sécurité.';
    }
    if (error.includes('storage/unauthenticated')) {
      return 'Vous devez être connecté pour télécharger une photo';
    }
    if (error.includes('network')) {
      return 'Erreur réseau. Vérifiez votre connexion Internet';
    }
    return error || 'Impossible de télécharger la photo. Veuillez réessayer.';
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
      console.log('Converting URI to blob:', uri);

      // On web, use fetch to convert URI to blob
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        console.log('Blob created from web URI, size:', blob.size);
        return blob;
      }

      // On mobile, use expo-file-system
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      console.log('Base64 conversion successful, creating blob...');

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'image/jpeg' });
      console.log('Blob created successfully, size:', blob.size);
      return blob;
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
