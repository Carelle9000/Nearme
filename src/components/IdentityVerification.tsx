import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  createVerificationSession,
  checkVerificationStatus,
} from '../services/verification';

interface IdentityVerificationProps {
  onSuccess: (result: { verified: boolean; sessionId: string }) => void;
  onError?: (error: Error) => void;
}

export function IdentityVerification({
  onSuccess,
  onError,
}: IdentityVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    clientSecret: string;
  } | null>(null);
  const [step, setStep] = useState<'init' | 'verification' | 'checking' | 'complete'>(
    'init'
  );
  const [pollCount, setPollCount] = useState(0);

  // Polling pour vérifier le statut après la fermeture du navigateur
  useEffect(() => {
    if (step === 'verification' && pollCount > 0 && pollCount < 30) {
      const timer = setTimeout(async () => {
        try {
          const status = await checkVerificationStatus();

          if (status.verified) {
            setStep('complete');
            onSuccess({
              verified: true,
              sessionId: sessionData?.sessionId || '',
            });
          } else if (
            status.status === 'requires_input' ||
            status.status === 'processing'
          ) {
            setPollCount(pollCount + 1);
          }
        } catch (error) {
          console.error('Erreur lors du polling:', error);
          setPollCount(pollCount + 1);
        }
      }, 2000); // Vérifier toutes les 2 secondes

      return () => clearTimeout(timer);
    }
  }, [step, pollCount, sessionData?.sessionId, onSuccess]);

  const startVerification = async () => {
    try {
      setLoading(true);

      // Créer une session de vérification
      const session = await createVerificationSession();

      if (!session.clientSecret || typeof session.clientSecret !== 'string') {
        throw new Error('Invalid session data');
      }

      if (!/^[a-zA-Z0-9_-]{20,}$/.test(session.clientSecret)) {
        throw new Error('Invalid client secret format');
      }

      setSessionData(session);

      // Construire l'URL de vérification Stripe
      const verificationUrl = `https://verifications.stripe.com/activity/${encodeURIComponent(session.clientSecret)}`;

      // Ouvrir le navigateur natif
      const result = await WebBrowser.openBrowserAsync(verificationUrl);

      if (result.type === 'opened' || result.type === 'dismiss') {
        setStep('verification');
        setPollCount(1);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur inconnue');
      Alert.alert(
        'Erreur',
        'Impossible de créer la session de vérification: ' + err.message
      );
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'init') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vérification d'identité</Text>
        <Text style={styles.description}>
          Pour continuer, nous devons vérifier votre âge avec votre document
          d'identité (passeport, permis, carte d'identité)
        </Text>

        <TouchableOpacity
          onPress={startVerification}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Vérifier mon identité</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'verification') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.title} >Vérification en cours...</Text>
        <Text style={styles.description}>
          Vérification de votre identité. Cela peut prendre quelques secondes.
        </Text>
        <Text style={styles.subtitle}>
          Polling: {pollCount}/30
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✓ Vérification complétée</Text>
      <Text style={styles.description}>Votre identité a été vérifiée avec succès.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
    textAlign: 'center',
    color: '#000000',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999999',
    marginTop: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 250,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
