import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

export default function HowItWorksScreen() {
  const router = useRouter();

  const steps = [
    {
      number: 1,
      icon: 'person-add',
      title: 'Create a genuine profile',
      description:
        'A few photos, your interests, a real introduction. Identity verification builds trust.',
    },
    {
      number: 2,
      icon: 'heart',
      title: 'Discover with intention',
      description:
        'No avalanche of profilesâ€”we suggest people who match your criteria and your vibe.',
    },
    {
      number: 3,
      icon: 'chatbubbles',
      title: 'Chat confidently',
      description:
        'You only exchange after mutual interest. Anti-spam tools, blocking, and one-click reporting.',
    },
    {
      number: 4,
      icon: 'shield-checkmark',
      title: 'A protected community',
      description:
        'Human moderation, safety tips before each date, complete control over your visibility.',
    },
  ];

  const rules = [
    'Be yourself: recent photos, accurate info, clear intentions.',
    'Respect everyone, in every message.',
    'No inappropriate content, harassment, or attacks tolerated.',
    'Reserved for adults (18+).',
  ];

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Welcome to NearMe</Text>
            <Text style={styles.subtitle}>
              An app designed so your meetings are genuine, respectful, and truly local.
            </Text>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {steps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </View>

          {/* Rules Section */}
          <View style={[styles.rulesCard, Shadows.card]}>
            <Text style={styles.rulesTitle}>Our rules</Text>
            <View style={styles.rulesList}>
              {rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>â€¢</Text>
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/auth/register')}
              >
                <Text style={styles.buttonText}>Create my profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StepCard({ step }: { step: { number: number; icon: string; title: string; description: string } }) {
  return (
    <View style={[styles.stepCard, Shadows.soft]}>
      <View style={styles.stepContent}>
        <View style={styles.stepIcon}>
          <Ionicons name={step.icon as any} size={28} color={Colors.text} />
        </View>
        <View style={styles.stepText}>
          <Text style={styles.stepNumber}>Ã‰TAPE {step.number}</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      </View>
    </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  stepCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: 20,
  },
  stepContent: {
    flexDirection: 'row',
    gap: 16,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  rulesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.base,
    padding: 24,
    marginBottom: 32,
  },
  rulesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  rulesList: {
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 12,
  },
  ruleBullet: {
    width: 20,
    justifyContent: 'flex-start',
  },
  ruleBulletText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  ctaContainer: {
    marginBottom: 32,
  },
  buttonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

