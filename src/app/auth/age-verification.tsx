import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AgeVerificationScreen() {
  const router = useRouter();

  const handleVerifyLater = () => {
    router.replace('/(tabs)/discover');
  };

  const handleVerifyNow = () => {
    // TODO: Integrate Stripe Identity
    alert('La vérification de l\'âge sera disponible bientôt');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification de l'âge</Text>
      <Text style={styles.message}>
        Nous devons vérifier votre âge pour respecter la législation locale.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyNow}>
          <Text style={styles.buttonText}>Vérifier maintenant</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleVerifyLater}>
          <Text style={styles.secondaryButtonText}>Vérifier plus tard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF1744',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
