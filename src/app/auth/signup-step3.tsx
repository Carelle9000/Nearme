import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useSignup } from '../../context/signup-context';
import { useAuth } from '../../context/auth-context';
import { signupService } from '../../services/signup.service';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { useRouter } from 'expo-router';

const GENDERS = ['Homme', 'Femme', 'Non-binaire', 'Autre'];

export default function SignupStep3() {
  const router = useRouter();
  const { data, updateData, prevStep, clearSensitiveData } = useSignup();
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid =
    data.firstName.trim().length > 0 &&
    data.birthYear.trim().length === 4 &&
    parseInt(data.birthYear) >= 1900 &&
    parseInt(data.birthYear) <= new Date().getFullYear() - 18 &&
    data.gender.length > 0 &&
    data.city.trim().length > 0;

  const handleCreateProfile = async () => {
    if (!isFormValid) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires correctement');
      return;
    }

    if (!signupService.isAgeValid(parseInt(data.birthYear))) {
      Alert.alert('Erreur', 'Vous devez avoir au moins 18 ans pour utiliser cette application');
      return;
    }

    if (!authUser) {
      Alert.alert('Erreur', 'Utilisateur non authentifié');
      return;
    }

    setIsLoading(true);
    try {
      // Update display name in Firebase Auth
      await signupService.updateDisplayName(authUser, data.firstName);

      // Create profile in Firestore
      await signupService.createProfile(authUser.uid, data);

      // Clear sensitive data from memory
      clearSensitiveData();

      // Navigate to discover
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      const message = signupService.getErrorMessage(error.code || error.message);
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <StepIndicatorItem number={1} label="Complet" completed />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={2} label="Règles" completed />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={3} label="Profil" active />
      </View>

      {/* Title */}
      <Text style={styles.title}>Votre profil</Text>
      <Text style={styles.subtitle}>Ces informations seront visibles par les autres</Text>

      {/* Form */}
      <View style={styles.form}>
        {/* First Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PRÉNOM</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Votre prénom"
              placeholderTextColor={Colors.textSecondary}
              value={data.firstName}
              onChangeText={(firstName) => updateData({ firstName })}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Birth Year */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>ANNÉE DE NAISSANCE</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ex: 1998"
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
          <Text style={styles.label}>GENRE</Text>
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
      <LinearGradient
        colors={[Colors.primary, '#C82E42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.buttonGradient, Shadows.glow, { opacity: isFormValid ? 1 : 0.6 }]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateProfile}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>Créer mon profil</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 4,
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
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
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
