import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { useLocalization } from '@/context/localization-context';
import { LANGUAGES } from '@/constants/locales';
import { useState } from 'react';

export default function LandingScreen() {
  const router = useRouter();
  const { hasConfigured, isLoading, t, language, setLanguage } = useLocalization();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === language);

  const handleLanguageSelect = async (code: string) => {
    await setLanguage(code);
    setShowLanguageModal(false);
  };

  const handleNavigateRegister = () => {
    if (isLoading) return;
    if (hasConfigured) {
      router.push('/auth/register');
    } else {
      router.push('/language-country?next=register');
    }
  };

  const handleNavigateLogin = () => {
    if (isLoading) return;
    if (hasConfigured) {
      router.push('/auth/login');
    } else {
      router.push('/language-country?next=login');
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logon.jpeg')}
                style={styles.logo}
              />
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.languageButton, isLoading && styles.buttonDisabled]}
                onPress={() => setShowLanguageModal(true)}
                disabled={isLoading}
              >
                <Text style={styles.languageButtonText}>{currentLanguage?.flag}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleNavigateLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>{t('loginButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language Selection Modal */}
          <Modal
            visible={showLanguageModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLanguageModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
                  <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.languageGrid}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.languageOptionActive,
                      ]}
                      onPress={() => handleLanguageSelect(lang.code)}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.languageLabel,
                          language === lang.code && styles.languageLabelActive,
                        ]}
                      >
                        {lang.nativeLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Modal>

          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.badgeText}>{t('geolocatedVerified')}</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroMain}>
              {t('goodPeople')}
            </Text>
            <View style={styles.heroHighlight}>
              <Text style={styles.heroHighlightText}>{t('nearYou')}</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              {t('landingSubtitle')}
            </Text>
          </View>

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNavigateRegister}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>{t('createProfile')}</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
              onPress={() => router.push('/how-it-works')}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>{t('howItWorks')}</Text>
            </TouchableOpacity>
          </View>

          {/* Featured Profile Card */}
          <View style={[styles.profileCard, Shadows.card]}>
            <View style={styles.profileImage}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={48} color={Colors.text} />
              </LinearGradient>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={styles.profileName}>Sarah, 28</Text>
                <View style={styles.onlineStatus}>
                  <Text style={styles.onlineText}>{t('online')}</Text>
                </View>
              </View>

              <Text style={styles.profileLocation}>1.2 km · Verified profile</Text>
              <Text style={styles.profileBio}>
                "Coffee in the morning, weekends out. Looking for someone attentive, fun, who loves cooking."
              </Text>

              <View style={styles.interestsRow}>
                <View style={styles.interestBadge}>
                  <Ionicons name="cafe" size={14} color={Colors.primary} />
                  <Text style={styles.interestText}>Coffee</Text>
                </View>
                <View style={styles.interestBadge}>
                  <Ionicons name="walk" size={14} color={Colors.primary} />
                  <Text style={styles.interestText}>Hiking</Text>
                </View>
                <View style={styles.interestBadge}>
                  <Ionicons name="restaurant" size={14} color={Colors.primary} />
                  <Text style={styles.interestText}>Cooking</Text>
                </View>
              </View>
            </View>
          </View>

          {/* New Match Card */}
          <LinearGradient
            colors={[Colors.primary, '#C82E42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.matchCard, Shadows.glow]}
          >
            <View style={styles.matchCardContent}>
              <View style={styles.matchIcon}>
                <Ionicons name="heart" size={20} color={Colors.text} />
              </View>
              <View style={styles.matchText}>
                <Text style={styles.matchLabel}>{t('newMatch')}</Text>
                <Text style={styles.matchTitle}>« Do you know this café from the 11th? »</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <FeatureCard
              icon="shield-checkmark"
              title={t('safetyFirst')}
              description={t('safetyDescription')}
            />
            <FeatureCard
              icon="star"
              title={t('genuineProfiles')}
              description={t('genuineDescription')}
            />
            <FeatureCard
              icon="location"
              title={t('trulyLocal')}
              description={t('trulyLocalDescription')}
            />
          </View>

          {/* Footer CTA */}
          <View style={styles.footerCTA}>
            <Text style={styles.footerText}>{t('readyToMeet')}</Text>
            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerButtonGradient}
            >
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleNavigateRegister}
                disabled={isLoading}
              >
                <Text style={styles.footerButtonText}>{t('getStarted')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={[styles.featureCard, Shadows.soft]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={32} color={Colors.primary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    resizeMode: 'contain',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
  },
  languageButtonText: {
    fontSize: 20,
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loginButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageOption: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 8,
  },
  languageOptionActive: {
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
    borderColor: Colors.primary,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  languageLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(232, 61, 81, 0.15)',
    borderRadius: BorderRadius.base,
    marginBottom: 24,
    gap: 6,
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  heroSection: {
    marginBottom: 40,
  },
  heroMain: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 56,
    marginBottom: 4,
  },
  heroHighlight: {
    marginBottom: 16,
  },
  heroHighlightText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 56,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 40,
  },
  primaryButtonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  onlineStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 150, 136, 0.15)',
    borderRadius: 4,
  },
  onlineText: {
    color: '#009688',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  interestText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  matchCard: {
    borderRadius: BorderRadius.base,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  matchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchText: {
    flex: 1,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  featuresSection: {
    marginBottom: 32,
    gap: 12,
  },
  featureCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  featureDescription: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footerCTA: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  footerButtonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    width: '100%',
  },
  footerButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

