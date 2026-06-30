import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSignup } from '../../context/signup-context';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

export default function SignupStep2() {
  const { data, updateData, nextStep, prevStep } = useSignup();

  const handleAccept = () => {
    if (!data.rulesAccepted) {
      return;
    }
    nextStep();
  };

  return (
    <View style={styles.container}>
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
        <StepIndicatorItem number={2} label="Règles" active />
        <View style={styles.stepConnector} />
        <StepIndicatorItem number={3} label="Profil" />
      </View>

      {/* Title */}
      <Text style={styles.title}>Règles de la communauté</Text>
      <Text style={styles.subtitle}>
        NearMe repose sur la confiance. Avant de commencer, nous vous demandons de respecter ces
        engagements.
      </Text>

      {/* Rules */}
      <View style={styles.rulesContainer}>
        <RuleCard
          icon="calendar"
          title="Je confirme avoir 18 ans ou plus"
          completed={data.rulesAccepted}
        />
        <RuleCard
          icon="heart"
          title="Je traite les autres avec respect"
          completed={data.rulesAccepted}
        />
      </View>

      {/* Accept Button */}
      <LinearGradient
        colors={[Colors.primary, '#C82E42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.buttonGradient, Shadows.glow, { opacity: data.rulesAccepted ? 1 : 0.6 }]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handleAccept}
          disabled={!data.rulesAccepted}
        >
          <Text style={styles.buttonText}>J'accepte les règles</Text>
        </TouchableOpacity>
      </LinearGradient>

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
            <Ionicons name="checkmark" size={16} color={Colors.text} />
          )}
        </View>
        <Text style={styles.checkboxLabel}>
          J'accepte les règles de la communauté et confirme que j'ai 18 ans ou plus
        </Text>
      </TouchableOpacity>
    </View>
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

function RuleCard({
  icon,
  title,
  completed,
}: {
  icon: string;
  title: string;
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
      <Text style={styles.ruleTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 32,
  },
  rulesContainer: {
    gap: 12,
    marginBottom: 32,
  },
  ruleCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleIconCompleted: {
    backgroundColor: Colors.primary,
  },
  ruleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
