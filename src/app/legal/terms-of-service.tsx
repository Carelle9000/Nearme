import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useLocalization } from '@/context/localization-context';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { t } = useLocalization();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('termsOfService')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. {t('acceptanceOfTerms')}</Text>
            <Text style={styles.text}>{t('acceptanceText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. {t('licenseOfUse')}</Text>
            <Text style={styles.text}>{t('licenseText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. {t('userAccount')}</Text>
            <Text style={styles.text}>{t('userAccountText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('passwordConfidentiality')}</Text>
              <Text style={styles.listItem}>• {t('accountActivities')}</Text>
              <Text style={styles.listItem}>• {t('reportUnauthorized')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. {t('userBehavior')}</Text>
            <Text style={styles.text}>{t('userBehaviorText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('harassOtherUsers')}</Text>
              <Text style={styles.listItem}>• {t('shareIllegalContent')}</Text>
              <Text style={styles.listItem}>• {t('fraudulentBehavior')}</Text>
              <Text style={styles.listItem}>• {t('spamPlatform')}</Text>
              <Text style={styles.listItem}>• {t('illegalUse')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. {t('userContent')}</Text>
            <Text style={styles.text}>{t('userContentText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. {t('limitationOfLiability')}</Text>
            <Text style={styles.text}>{t('limitationText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('indirectDamages')}</Text>
              <Text style={styles.listItem}>• {t('dataLoss')}</Text>
              <Text style={styles.listItem}>• {t('serviceInterruption')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. {t('serviceModification')}</Text>
            <Text style={styles.text}>{t('modificationText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. {t('termination')}</Text>
            <Text style={styles.text}>{t('terminationText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. {t('modificationOfTerms')}</Text>
            <Text style={styles.text}>{t('modificationOfTermsText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. {t('governingLaw')}</Text>
            <Text style={styles.text}>{t('governingLawText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. {t('contact')}</Text>
            <Text style={styles.text}>{t('termsContact')}</Text>
          </View>

          <View style={styles.lastUpdate}>
            <Text style={styles.lastUpdateText}>{t('lastUpdatedJanuary')}</Text>
          </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  list: {
    marginLeft: 8,
    gap: 4,
  },
  listItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  lastUpdate: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 24,
  },
  lastUpdateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

