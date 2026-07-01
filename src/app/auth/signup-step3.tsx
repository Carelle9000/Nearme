import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useSignup } from '../../context/signup-context';
import { signupService } from '../../services/signup.service';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { auth } from '../../config/firebase';
import { useLocalization } from '../../context/localization-context';

const GENDERS = ['Homme', 'Femme', 'Non-binaire', 'Autre'];
const INTERESTS = ['Travel', 'Music', 'Sport', 'Art', 'Food', 'Gaming', 'Books', 'Movies', 'Fitness'];

export default function SignupStep3() {
  const router = useRouter();
  const { data, updateData, prevStep, clearSensitiveData } = useSignup();
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const calculateAge = (birthYear: string): number | null => {
    if (!birthYear || birthYear.length !== 4) return null;
    const year = parseInt(birthYear, 10);
    if (isNaN(year)) return null;
    return new Date().getFullYear() - year;
  };

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (photos.length < 6) {
          setPhotos([...photos, result.assets[0].uri]);
        } else {
          setErrorModal({
            visible: true,
            title: t('photoLimit'),
            message: t('photoLimitMessage'),
          });
        }
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        title: t('error'),
        message: t('photoLoadError'),
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const isFormValid =
    data.firstName.trim().length > 0 &&
    data.birthYear.trim().length === 4 &&
    parseInt(data.birthYear) >= 1900 &&
    parseInt(data.birthYear) <= new Date().getFullYear() - 18 &&
    data.gender.length > 0 &&
    data.city.trim().length > 0;

  const handleCreateProfile = async () => {
    if (!isFormValid) {
      setErrorModal({
        visible: true,
        title: t('error'),
        message: t('fillAllFields'),
      });
      return;
    }

    if (!signupService.isAgeValid(parseInt(data.birthYear))) {
      setErrorModal({
        visible: true,
        title: t('error'),
        message: t('ageVerificationDescription'),
      });
      return;
    }

    // Get current user from Firebase Auth
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setErrorModal({
        visible: true,
        title: t('error'),
        message: t('error'),
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating profile for user:', currentUser.uid);
      // Update display name in Firebase Auth
      await signupService.updateDisplayName(currentUser, data.firstName);

      // Create profile in Realtime Database with photos and interests
      const profileData = {
        ...data,
        photos: photos,
        interests: data.interests || [],
      };

      await signupService.createProfile(currentUser.uid, profileData);

      // Clear sensitive data from memory
      clearSensitiveData();

      console.log('Profile created successfully, navigating to discover');
      // Navigate to home page
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      const message = signupService.getErrorMessage(error.code || error.message);
      setErrorModal({
        visible: true,
        title: t('error'),
        message: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={prevStep}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <StepIndicatorItem number={1} label={t('accountStep')} completed />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={2} label={t('rulesStep')} completed />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={3} label={t('profileStep')} active />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t('step3Title')}</Text>
      <Text style={styles.subtitle}>{t('step3Subtitle')}</Text>

      {/* Form */}
      <View style={styles.form}>
        {/* First Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('firstNameLabel')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('firstNamePlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              value={data.firstName}
              onChangeText={(firstName) => updateData({ firstName })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Birth Year */}
        <View style={styles.fieldGroup}>
          <View style={styles.birthYearHeader}>
            <Text style={styles.label}>{t('birthYearLabel')}</Text>
            {calculateAge(data.birthYear) && (
              <Text style={styles.ageLabel}>{calculateAge(data.birthYear)} {t('ageLabel')}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('birthYearPlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              value={data.birthYear}
              onChangeText={(birthYear) => updateData({ birthYear })}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Gender */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('genderLabel')}</Text>
          <View style={styles.genderGrid}>
            {GENDERS.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  data.gender === gender && styles.genderButtonActive,
                  Shadows.soft,
                ]}
                onPress={() => updateData({ gender })}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    data.gender === gender && styles.genderButtonTextActive,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* City */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>VILLE</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Paris, Lyon, Marseille..."
              placeholderTextColor={Colors.textSecondary}
              value={data.city}
              onChangeText={(city) => updateData({ city })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Photos */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PHOTOS ({photos.length}/6)</Text>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.photoRemoveButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity
                style={[styles.photoAddButton, Shadows.soft]}
                onPress={handleAddPhoto}
                disabled={isLoading}
              >
                <Ionicons name="add" size={32} color={Colors.primary} />
                <Text style={styles.photoAddText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>MES INTÉRÊTS</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => {
              const isSelected = data.interests?.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestTag,
                    isSelected && styles.interestTagActive,
                    Shadows.soft,
                  ]}
                  onPress={() => {
                    const newInterests = isSelected
                      ? data.interests?.filter((i) => i !== interest) || []
                      : [...(data.interests || []), interest];
                    updateData({ interests: newInterests });
                  }}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.interestText,
                      isSelected && styles.interestTextActive,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <View style={styles.bioHeader}>
            <Text style={styles.label}>BIO</Text>
            <Text style={styles.charCount}>{data.bio.length}/500</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Parlez un peu de vous..."
              placeholderTextColor={Colors.textSecondary}
              value={data.bio}
              onChangeText={(bio) => updateData({ bio: bio.slice(0, 500) })}
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleCreateProfile}
        disabled={!isFormValid || isLoading}
        activeOpacity={isFormValid ? 0.7 : 1}
      >
        <LinearGradient
          colors={[Colors.primary, '#C82E42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.buttonGradient,
            Shadows.glow,
            (!isFormValid || isLoading) && styles.buttonDisabled,
          ]}
        >
          <View style={styles.button}>
            {isLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.buttonText}>Créer mon profil</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <ConfirmationModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        confirmText="OK"
        onCancel={() => setErrorModal({ ...errorModal, visible: false })}
        onConfirm={() => setErrorModal({ ...errorModal, visible: false })}
      />
    </ScrollView>
    </>
  );
}

function StepIndicatorItem({
  number,
  label,
  active = false,
  completed = false,
}: {
  number: number;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          active && styles.stepCircleActive,
          completed && styles.stepCircleCompleted,
        ]}
      >
        {completed ? (
          <Ionicons name="checkmark" size={18} color={Colors.text} />
        ) : (
          <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>
            {number}
          </Text>
        )}
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  backButton: {
    marginLeft: 20,
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.text,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  stepConnector: {
    height: 2,
    flex: 0.6,
    backgroundColor: Colors.border,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginHorizontal: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    marginHorizontal: 20,
  },
  form: {
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  inputIcon: {
    marginVertical: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  bioInput: {
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderButton: {
    flex: 0.47,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  genderButtonTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  buttonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  photoAddButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.cardSurface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestTagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  interestTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  birthYearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});
