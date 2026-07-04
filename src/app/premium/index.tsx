import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePremium } from '@/context/premium-context';
import { useLocalization } from '@/context/localization-context';
import { PremiumBadge } from '@/components/PremiumBadge';

/**
 * Premium Subscription Page
 * Shows features and subscription management
 */
export default function PremiumScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium, isTrial, subscriptionInfo, refreshPremiumStatus } = usePremium();
  const { t } = useLocalization();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  const features = [
    {
      icon: '⭐',
      title: t('premiumFeatureFeatured'),
      description: t('premiumFeatureFeaturedDesc'),
      premium: true,
    },
    {
      icon: '🔄',
      title: t('premiumFeatureUndo'),
      description: t('premiumFeatureUndoDesc'),
      premium: true,
    },
    {
      icon: '👀',
      title: t('premiumFeatureLikes'),
      description: t('premiumFeatureLikesDesc'),
      premium: true,
    },
    {
      icon: '💬',
      title: t('premiumFeatureMessage'),
      description: t('premiumFeatureMessageDesc'),
      premium: true,
    },
    {
      icon: '📊',
      title: t('premiumFeatureStats'),
      description: t('premiumFeatureStatsDesc'),
      premium: true,
    },
    {
      icon: '🌍',
      title: t('premiumFeatureRadius'),
      description: t('premiumFeatureRadiusDesc'),
      premium: true,
    },
    {
      icon: '🎚️',
      title: t('premiumFeatureFilters'),
      description: t('premiumFeatureFiltersDesc'),
      premium: true,
    },
    {
      icon: '✨',
      title: t('premiumFeatureProfile'),
      description: t('premiumFeatureProfileDesc'),
      premium: true,
    },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const stripeLink = 'https://buy.stripe.com/28EbJ3fFFbdBflCd4LcMM07';
      const canOpen = await Linking.canOpenURL(stripeLink);

      if (canOpen) {
        await Linking.openURL(stripeLink);
      } else {
        Alert.alert(
          t('error'),
          t('documentUploadError')
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(t('error'), t('documentUploadError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement restore purchase logic
      Alert.alert(
        'Restore',
        'Restoring purchases. Feature coming soon!',
        [{ text: 'OK', onPress: () => setIsProcessing(false) }]
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Unable to restore the purchase');
      setIsProcessing(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Status */}
          {isPremium && (
            <View style={[styles.card, styles.statusCard]}>
              <View style={styles.statusContent}>
                <PremiumBadge size="large" />
                <Text style={styles.statusTitle}>
                  {isTrial ? t('trialActive') : t('youArePremium')}
                </Text>
                {subscriptionInfo.daysRemaining !== undefined && (
                  <Text style={styles.statusSubtitle}>
                    {isTrial
                      ? t('trialExpiresIn').replace('{days}', subscriptionInfo.daysRemaining.toString())
                      : t('renewsIn').replace('{days}', subscriptionInfo.daysRemaining.toString())}
                  </Text>
                )}
              </View>
              {!isTrial && (
                <TouchableOpacity style={styles.manageButton}>
                  <Text style={styles.manageButtonText}>{t('premiumManage')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Trial Expired Section */}
          {!isPremium && subscriptionInfo.tier === 'trial' && subscriptionInfo.status === 'expired' && (
            <View style={[styles.card, styles.statusCard]}>
              <View style={styles.statusContent}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>⏰</Text>
                <Text style={styles.statusTitle}>{t('trialExpired')}</Text>
                <Text style={styles.statusSubtitle}>{t('upgradeNow')}</Text>
              </View>
            </View>
          )}

          {/* Price Section */}
          {!isPremium && subscriptionInfo.status !== 'expired' && (
            <View style={[styles.card, styles.priceCard]}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceLabel}>{t('premiumAccess')}</Text>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>{t('premiumBestValue')}</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>12.99</Text>
                <Text style={styles.priceCurrency}>$</Text>
                <Text style={styles.pricePeriod}>/month</Text>
              </View>

              <Text style={styles.priceDescription}>{t('premiumTrial')}</Text>

              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <>
                    <Ionicons name="star" size={20} color={Colors.text} style={styles.buttonIcon} />
                    <Text style={styles.subscribeButtonText}>{t('premiumGo')}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Security Badges */}
              <View style={styles.securityContainer}>
                <View style={styles.securityBadge}>
                  <Ionicons name="lock-closed" size={16} color={Colors.success} />
                  <Text style={styles.securityText}>{t('securePayment')}</Text>
                </View>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                  <Text style={styles.securityText}>{t('sslEncrypted')}</Text>
                </View>
              </View>

              <View style={styles.trustContainer}>
                <Text style={styles.trustIcon}>🔒</Text>
                <Text style={styles.trustText}>Stripe • 100% secure payment</Text>
              </View>

              {!isPremium && (
                <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
                  <Text style={styles.restoreLink}>{t('retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>{t('fullProfiles')}</Text>

            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </View>
              ))}
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Questions</Text>

            <View style={[styles.card, styles.faqItem]}>
              <Text style={styles.faqQuestion}>❓ Can I cancel my subscription?</Text>
              <Text style={styles.faqAnswer}>
                Yes, you can cancel your subscription at any time. No penalty.
              </Text>
            </View>

            <View style={[styles.card, styles.faqItem]}>
              <Text style={styles.faqQuestion}>❓ How does the free trial work?</Text>
              <Text style={styles.faqAnswer}>
                7 days free, then automatic renewal. You can cancel before the end of the trial period.
              </Text>
            </View>

            <View style={[styles.card, styles.faqItem]}>
              <Text style={styles.faqQuestion}>❓ Can I change plans?</Text>
              <Text style={styles.faqAnswer}>
                Of course! You can upgrade or downgrade at any time.
              </Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              By subscribing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and our{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  card: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContent: {
    alignItems: 'center',
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.two,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.one,
  },
  manageButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
  },
  manageButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  priceCard: {
    alignItems: 'center',
  },
  priceHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bestValueBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: BorderRadius.md,
  },
  bestValueText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.one,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceCurrency: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: Spacing.one,
  },
  pricePeriod: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: Spacing.one,
  },
  priceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.three,
  },
  subscribeButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  buttonIcon: {
    marginRight: Spacing.two,
  },
  subscribeButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  restoreLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  securityContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  securityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  trustContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  trustIcon: {
    fontSize: 18,
  },
  trustText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  featuresSection: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.three,
  },
  featuresList: {
    gap: Spacing.two,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.md,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: Spacing.three,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.half,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  faqSection: {
    marginBottom: Spacing.four,
  },
  faqItem: {
    marginBottom: Spacing.two,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.two,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsSection: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.accent,
    fontWeight: '600',
  },
});

