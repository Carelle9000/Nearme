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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/profile-context';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { userService } from '../../services';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManagePhotosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profilePhotos, isUploadingPhoto, pickAndUploadPhoto, takeAndUploadPhoto, deletePhoto } =
    useProfile();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user?.location) {
      // Load user photos on mount
    }
  }, [user?.id]);

  const handleUploadPhoto = () => {
    Alert.alert('Ajouter une photo', 'Choisir une source', [
      {
        text: 'Appareil photo',
        onPress: takeAndUploadPhoto,
      },
      {
        text: 'Galerie',
        onPress: pickAndUploadPhoto,
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleDeletePhoto = (photoUrl: string) => {
    Alert.alert('Supprimer la photo', 'Êtes-vous sûr de vouloir supprimer cette photo ?', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deletePhoto(photoUrl),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const renderPhotoItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.photoCard}
      onPress={() => {
        setPreviewUrl(item);
        setShowPreview(true);
      }}
      disabled={isUploadingPhoto}
    >
      <Image source={{ uri: item }} style={styles.photoImage} />
      <View style={styles.photoOverlay}>
        <Ionicons name="eye-outline" size={32} color="#fff" />
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePhoto(item)}
        disabled={isUploadingPhoto}
      >
        <Ionicons name="trash" size={20} color="#fff" />
      </TouchableOpacity>
      {index === 0 && (
        <View style={styles.primaryBadge}>
          <Ionicons name="star" size={14} color="#fff" />
          <Text style={styles.primaryBadgeText}>Principal</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gérer mes photos</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Mes photos ({profilePhotos.length}/6)
            </Text>
            <Text style={styles.sectionDescription}>
              La première photo sera votre photo de profil
            </Text>
          </View>

          {profilePhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={64} color={Colors.accent} />
              <Text style={styles.emptyText}>Aucune photo pour l'instant</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre première photo pour commencer</Text>
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
                <ActivityIndicator color={Colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color={Colors.text} />
                  <Text style={styles.uploadButtonText}>Ajouter une photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Conseils pour de bonnes photos</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Utilisez des photos claires et récentes de vous seul</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Montrez bien votre visage</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Évitez les filtres ou les retouches excessives</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Ajoutez de la variété à vos photos</Text>
            </View>
          </View>
        </ScrollView>

        {/* Photo Preview Modal */}
        <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
          <View style={styles.previewContainer}>
            <SafeAreaView style={styles.previewSafeArea}>
              <View style={styles.previewHeader}>
                <TouchableOpacity onPress={() => setShowPreview(false)}>
                  <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.previewTitle}>Aperçu</Text>
                <View style={{ width: 28 }} />
              </View>

              <View style={styles.previewImageContainer}>
                {previewUrl && (
                  <Image source={{ uri: previewUrl }} style={styles.previewImage} />
                )}
              </View>

              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.deletePreviewButton]}
                  onPress={() => {
                    setShowPreview(false);
                    if (previewUrl) {
                      handleDeletePhoto(previewUrl);
                    }
                  }}
                >
                  <Ionicons name="trash" size={20} color={Colors.text} />
                  <Text style={styles.previewButtonText}>Supprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewCloseButton}
                  onPress={() => setShowPreview(false)}
                >
                  <Text style={styles.previewCloseText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    backgroundColor: Colors.secondary,
    ...Shadows.soft,
  },
  photoImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.secondary,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Shadows.soft,
  },
  primaryBadgeText: {
    color: Colors.text,
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
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.base,
    marginBottom: 24,
    gap: 12,
    ...Shadows.soft,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: BorderRadius.base,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  previewSafeArea: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    gap: 8,
  },
  deletePreviewButton: {
    backgroundColor: Colors.primary,
  },
  previewButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  previewCloseButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  previewCloseText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
