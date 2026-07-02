import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignup, SignupProvider } from '@/context/signup-context';
import { Colors } from '@/constants/theme';
import SignupStep1 from './signup-step1';
import SignupStep2 from './signup-step2';
import SignupStep3 from './signup-step3';

function SignupContent() {
  const { step } = useSignup();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 1 && <SignupStep1 />}
          {step === 2 && <SignupStep2 />}
          {step === 3 && <SignupStep3 />}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function SignupScreen() {
  return (
    <SignupProvider>
      <SignupContent />
    </SignupProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

