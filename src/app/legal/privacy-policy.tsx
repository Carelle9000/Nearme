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

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLocalization();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('privacyPolicy')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. {t('introduction')}</Text>
            <Text style={styles.text}>{t('privacyIntroText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. {t('dataCollected')}</Text>
            <Text style={styles.text}>{t('dataCollectedText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('accountInformation')}</Text>
              <Text style={styles.listItem}>• {t('userProfile')}</Text>
              <Text style={styles.listItem}>• {t('location')}</Text>
              <Text style={styles.listItem}>• {t('messageHistory')}</Text>
              <Text style={styles.listItem}>• {t('preferences')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. {t('dataUsage')}</Text>
            <Text style={styles.text}>{t('dataUsageText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('provideServices')}</Text>
              <Text style={styles.listItem}>• {t('recommendProfiles')}</Text>
              <Text style={styles.listItem}>• {t('accountSecurity')}</Text>
              <Text style={styles.listItem}>• {t('contactYou')}</Text>
              <Text style={styles.listItem}>• {t('legalCompliance')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. {t('dataSharing')}</Text>
            <Text style={styles.text}>{t('dataSharingText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('lawCompliance')}</Text>
              <Text style={styles.listItem}>• {t('protectSecurity')}</Text>
              <Text style={styles.listItem}>• {t('explicitConsent')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. {t('dataSecurity')}</Text>
            <Text style={styles.text}>{t('dataSecurityText')}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. {t('yourRights')}</Text>
            <Text style={styles.text}>{t('yourRightsText')}</Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• {t('accessData')}</Text>
              <Text style={styles.listItem}>• {t('correctData')}</Text>
              <Text style={styles.listItem}>• {t('deleteData')}</Text>
              <Text style={styles.listItem}>• {t('objectProcessing')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. {t('contact')}</Text>
            <Text style={styles.text}>{t('privacyContact')}</Text>
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

