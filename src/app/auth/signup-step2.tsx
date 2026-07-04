import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useSignup } from '@/context/signup-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { stripeIdentityService } from '@/services/stripe-identity.service';
import { useLocalization } from '@/context/localization-context';

export default function SignupStep2() {
  const { data, updateData, nextStep, prevStep } = useSignup();
  const { t } = useLocalization();
  const [documentSelected, setDocumentSelected] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setDocumentSelected(true);

      // Validate document with Stripe
      setIsValidating(true);
      const verificationResult = await stripeIdentityService.startVerification(file);

      if (verificationResult.status === 'verified') {
        setVerificationStatus(t('verificationSuccess'));
        // Proceed to next step after a short delay
        setTimeout(() => {
          nextStep();
        }, 1500);
      } else if (verificationResult.status === 'requires_input') {
        setVerificationStatus(t('verifyingDocument'));
      } else {
        Alert.alert(
          t('verificationFailed'),
          t('documentVerificationError')
        );
        setDocumentSelected(false);
      }
    } catch (error: any) {
      Alert.alert(t('error'), t('documentUploadError'));
      console.error('Document upload error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const isRulesAndDocumentsReady = data.rulesAccepted && documentSelected && verificationStatus === t('verificationSuccess');

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
        <StepIndicatorItem number={1} label={t('accountStep')} completed />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={2} label={t('rulesStep')} active />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={3} label={t('profileStep')} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t('identityVerification')}</Text>
      <Text style={styles.subtitle}>
        {t('identityVerificationDesc')}
      </Text>

      {/* Rules Section */}
      <View style={styles.rulesContainer}>
        <Text style={styles.sectionTitle}>{t('communityRules')}</Text>
        <RuleCard
          icon="calendar"
          title={t('ageConfirmation')}
          description={t('ageConfirmationDesc')}
          completed={data.rulesAccepted}
        />
        <RuleCard
          icon="heart"
          title={t('respectOthers')}
          description={t('respectOthersDesc')}
          completed={data.rulesAccepted}
        />
        <RuleCard
          icon="shield-checkmark"
          title={t('safetyRespect')}
          description={t('safetyRespectDesc')}
          completed={data.rulesAccepted}
        />
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => updateData({ rulesAccepted: !data.rulesAccepted })}
      >
        <View
          style={[
            styles.checkbox,
            data.rulesAccepted && styles.checkboxChecked,
          ]}
        >
          {data.rulesAccepted && (
            <Ionicons name="checkmark" size={14} color={Colors.text} />
          )}
        </View>
        <Text style={styles.checkboxLabel}>
          {t('acceptRules')}
        </Text>
      </TouchableOpacity>

      {data.rulesAccepted && (
        <View style={styles.documentSection}>
          <Text style={styles.sectionTitle}>{t('uploadIdentity')}</Text>
          <Text style={styles.documentSubtitle}>{t('acceptedDocuments')}</Text>
          <LinearGradient
            colors={[Colors.primary, '#C82E42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonGradient, Shadows.glow]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.button}
              onPress={handleUploadDocument}
              disabled={isValidating}
            >
              {isValidating ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="cloud-upload" size={20} color={Colors.text} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>
                    {documentSelected ? 'Document verified ✓' : 'Upload a document'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
          {verificationStatus ? (
            <Text style={[styles.statusMessage, { color: verificationStatus === t('verificationSuccess') ? Colors.success : Colors.warning }]}>
              {verificationStatus}
            </Text>
          ) : null}
        </View>
      )}

      {/* Continue Button - Show when both rules and document are done */}
      {isRulesAndDocumentsReady && (
        <LinearGradient
          colors={[Colors.primary, '#C82E42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.buttonGradient, Shadows.glow]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.button}
            onPress={nextStep}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.buttonText}>Continue to profile</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
        </LinearGradient>
      )}
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
          <Ionicons name="checkmark" size={16} color={Colors.text} />
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

function RuleCard({
  icon,
  title,
  description,
  completed,
}: {
  icon: string;
  title: string;
  description: string;
  completed: boolean;
}) {
  return (
    <View style={[styles.ruleCard, Shadows.soft]}>
      <View
        style={[
          styles.ruleIcon,
          completed && styles.ruleIconCompleted,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={completed ? Colors.text : Colors.primary}
        />
      </View>
      <View style={styles.ruleContent}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 16,
  },
  backButton: {
    paddingLeft: 20,
    paddingBottom: 16,
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
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 32,
    marginHorizontal: 20,
  },
  rulesContainer: {
    gap: 12,
    marginBottom: 24,
    marginHorizontal: 20,
  },
  ruleCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  ruleIconCompleted: {
    backgroundColor: Colors.primary,
  },
  ruleContent: {
    flex: 1,
    gap: 4,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  ruleDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  documentSection: {
    marginTop: 32,
    marginBottom: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.large,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  documentSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  statusMessage: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

