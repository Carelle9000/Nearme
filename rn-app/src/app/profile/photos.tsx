import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/profile-context';
import { useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { userService } from '../../services';

export default function ManagePhotosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profilePhotos, isUploadingPhoto, pickAndUploadPhoto, takeAndUploadPhoto, deletePhoto } =
    useProfile();

  useEffect(() => {
    if (user?.location) {
      // Load user photos on mount
    }
  }, [user?.id]);

  const handleUploadPhoto = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: takeAndUploadPhoto,
      },
      {
        text: 'Gallery',
        onPress: pickAndUploadPhoto,
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeletePhoto = (photoUrl: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePhoto(photoUrl),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderPhotoItem = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item }} style={styles.photoImage} />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePhoto(item)}
        disabled={isUploadingPhoto}
      >
        <Ionicons name="trash" size={20} color="#fff" />
      </TouchableOpacity>
      {index === 0 && <View style={styles.primaryBadge}>
        <Text style={styles.primaryBadgeText}>Primary</Text>
      </View>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Photos</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Photos ({profilePhotos.length}/6)
          </Text>
          <Text style={styles.sectionDescription}>
            The first photo will be your primary photo
          </Text>
        </View>

        {profilePhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="image-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Add your first photo to get started</Text>
          </View>
        ) : (
          <FlatList
            data={profilePhotos}
            renderItem={renderPhotoItem}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.photoGrid}
            contentContainerStyle={styles.photoListContent}
          />
        )}

        {profilePhotos.length < 6 && (
          <TouchableOpacity
            style={[styles.uploadButton, isUploadingPhoto && styles.uploadButtonDisabled]}
            onPress={handleUploadPhoto}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.uploadButtonText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for Good Photos</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#FF1744" />
            <Text style={styles.tipText}>Use clear, recent photos of just you</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#FF1744" />
            <Text style={styles.tipText}>Show your face clearly</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#FF1744" />
            <Text style={styles.tipText}>Avoid filters or heavy edits</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#FF1744" />
            <Text style={styles.tipText}>Add variety to your photos</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  photoGrid: {
    gap: 12,
  },
  photoListContent: {
    marginBottom: 16,
  },
  photoCard: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,23,68,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FF1744',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1744',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
});
