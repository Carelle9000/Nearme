import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { IdentityVerification } from '../../components/IdentityVerification';
import { Colors, BorderRadius } from '../../constants/theme';
import { useLocalization } from '../../context/localization-context';

export default function AgeVerificationV2() {
  const router = useRouter();
  const [verificationStep, setVerificationStep] = useState<
    'choice' | 'verification' | 'success'
  >('choice');
  const [verificationData, setVerificationData] = useState<{
    verified: boolean;
    sessionId: string;
  } | null>(null);

  const handleVerificationSuccess = async (result: {
    verified: boolean;
    sessionId: string;
  }) => {
    setVerificationData(result);
    setVerificationStep('success');

    // Attendre 2 secondes puis rediriger
    setTimeout(() => {
      router.push('/(tabs)/discover');
    }, 2000);
  };

  const handleVerificationError = (error: Error) => {
    Alert.alert('Erreur de vérification', error.message);
  };

  if (verificationStep === 'verification') {
    return (
      <View style={styles.container}>
        <IdentityVerification
          onSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
        />
      </View>
    );
  }

  if (verificationStep === 'success') {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4ADE80" />
          </View>

          <Text style={styles.successTitle}>Vérification réussie!</Text>
          <Text style={styles.successDescription}>
            Votre âge a été vérifié avec succès. Vous pouvez maintenant accéder
            à toutes les fonctionnalités de l'application.
          </Text>

          <View style={styles.featuresList}>
            <FeatureItem icon="heart" text="Accès complet aux profils" />
            <FeatureItem icon="chatbubble" text="Messagerie illimitée" />
            <FeatureItem icon="location" text="Localisation précise" />
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={60} color="#FFFFFF" />
          <Text style={styles.title}>Vérification d'âge</Text>
          <Text style={styles.subtitle}>
            Pour des raisons de sécurité et de conformité, nous devons vérifier
            votre âge
          </Text>
        </View>

        {/* Information Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            Nous acceptons les documents suivants:
          </Text>
          <View style={styles.documentList}>
            <DocumentItem type="Passeport" />
            <DocumentItem type="Carte d'identité" />
            <DocumentItem type="Permis de conduire" />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <StepItem
            number={1}
            title="Préparez votre document"
            description="Ayez votre passeport, permis ou carte d'identité à portée de main"
          />
          <StepItem
            number={2}
            title="Prenez une photo"
            description="Notre système sécurisé analysera votre document"
          />
          <StepItem
            number={3}
            title="Selfie de confirmation"
            description="Prenez une photo de vous pour confirmer votre identité"
          />
        </View>

        {/* Main Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setVerificationStep('verification')}
        >
          <Text style={styles.primaryButtonText}>
            Vérifier mon identité
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Skip Button (optional) */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            Alert.alert(
              'Vérification requise',
              'La vérification d\'identité est obligatoire pour utiliser l\'application.'
            );
          }}
        >
          <Text style={styles.secondaryButtonText}>En savoir plus</Text>
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color="#999" />
          <Text style={styles.securityText}>
            Vos données sont chiffrées et traitées de manière sécurisée par Stripe
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={24} color="#4ADE80" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function DocumentItem({ type }: { type: string }) {
  return (
    <View style={styles.documentItem}>
      <Ionicons name="document" size={16} color={Colors.primary} />
      <Text style={styles.documentItemText}>{type}</Text>
    </View>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 12,
  },
  documentList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentItemText: {
    fontSize: 13,
    color: '#333333',
  },
  stepsContainer: {
    marginHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  primaryButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#4ADE80',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.lg,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  securityInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BorderRadius.md,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 20,
  },
  featuresList: {
    marginTop: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginHorizontal: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  iconContainer: {
    marginBottom: 20,
  },
});
