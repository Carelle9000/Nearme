import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/auth-context';
import { useProfile } from '../../context/profile-context';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalization } from '../../context/localization-context';

const INTERESTS_OPTIONS = [
  'Voyages', 'Musique', 'Sport', 'Art', 'Cinéma', 'Cuisine',
  'Lecture', 'Technologie', 'Nature', 'Photographie', 'Mode', 'Gaming',
  'Yoga', 'Danse', 'Histoire', 'Science', 'Théâtre', 'Fitness',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useLocalization();
  const { user, updateProfile } = useAuth();
  const { error, clearError, pickAndUploadPhoto, isUploadingPhoto } = useProfile();

  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'other');
  const [isSaving, setIsSaving] = useState(false);
  const [birthDate, setBirthDate] = useState<Date>(user?.birthDate ? new Date(user.birthDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(user.displayName || user.name || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBio(user.bio || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedInterests(user.interests || []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGender(user.gender || 'other');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBirthDate(user.birthDate ? new Date(user.birthDate) : new Date());
    }
  }, [user?.id]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleChangeProfilePhoto = async () => {
    try {
      const success = await pickAndUploadPhoto();
      if (success) {
        Alert.alert(t('success'), 'Photo de profil mise à jour');
      }
    } catch (err: any) {
      Alert.alert(t('error'), err.message || 'Impossible de charger la photo');
    }
  };

  const getAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert(t('error'), 'Le nom d\'affichage ne peut pas être vide');
      return;
    }

    const age = getAge(birthDate);
    if (age < 18) {
      Alert.alert(t('error'), 'Vous devez avoir au moins 18 ans');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        interests: selectedInterests,
        gender,
        birthDate: birthDate.toISOString(),
      });
      Alert.alert(t('success'), 'Votre profil a été mis à jour');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/profile');
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'Impossible de mettre à jour le profil');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}
            disabled={isSaving}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier mon profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="checkmark" size={28} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Photo de profil */}
          <View style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="#fff" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.changePhotoButton, isUploadingPhoto && styles.disabledButton]}
              onPress={handleChangeProfilePhoto}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator color={Colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="camera" size={18} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.changePhotoButtonText}>Changer la photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Nom d'affichage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nom d'affichage</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre nom"
              placeholderTextColor={Colors.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!isSaving}
              maxLength={50}
            />
            <Text style={styles.charCount}>{displayName.length}/50</Text>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Parlez-nous de vous..."
              placeholderTextColor={Colors.textSecondary}
              value={bio}
              onChangeText={setBio}
              editable={!isSaving}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          {/* Genre */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genre</Text>
            <View style={styles.genderButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('female')}
                disabled={isSaving}
              >
                <Ionicons
                  name="woman"
                  size={20}
                  color={gender === 'female' ? '#fff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Femme
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('male')}
                disabled={isSaving}
              >
                <Ionicons
                  name="man"
                  size={20}
                  color={gender === 'male' ? '#fff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Homme
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'other' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('other')}
                disabled={isSaving}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={gender === 'other' ? '#fff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'other' && styles.genderButtonTextActive,
                  ]}
                >
                  Autre
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date de naissance */}
          <View style={styles.section}>
            <View style={styles.birthDateHeader}>
              <Text style={styles.sectionTitle}>Date de naissance</Text>
              <Text style={styles.ageText}>{getAge(birthDate)} ans</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              disabled={isSaving}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateButtonText}>
                {birthDate.toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())}
              />
            )}
          </View>

          {/* Intérêts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Intérêts ({selectedInterests.length})
            </Text>
            <View style={styles.interestsGrid}>
              {INTERESTS_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestTag,
                    selectedInterests.includes(interest) && styles.interestTagActive,
                  ]}
                  onPress={() => toggleInterest(interest)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.interestTagText,
                      selectedInterests.includes(interest) && styles.interestTagTextActive,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  changePhotoButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    ...Shadows.soft,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  genderButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  genderButtonTextActive: {
    color: Colors.text,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.base,
  },
  interestTagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent,
  },
  interestTagTextActive: {
    color: Colors.text,
  },
  spacer: {
    height: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    marginBottom: 16,
    gap: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  birthDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});
