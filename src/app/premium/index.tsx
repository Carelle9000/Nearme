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
import { PremiumBadge } from '@/components/PremiumBadge';

/**
 * Premium Subscription Page
 * Shows features and subscription management
 */
export default function PremiumScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium, subscriptionInfo, refreshPremiumStatus } = usePremium();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  const features = [
    {
      icon: 'â­',
      title: 'Profils mis en avant',
      description: 'Soyez visible en premier pour les autres premium',
      premium: true,
    },
    {
      icon: 'ðŸ”„',
      title: 'Undo illimitÃ©',
      description: 'Revenir sur vos likes et dislikes',
      premium: true,
    },
    {
      icon: 'ðŸ‘€',
      title: 'Qui m\'a aimÃ©',
      description: 'Voyez qui vous a likÃ© sans attendre un match',
      premium: true,
    },
    {
      icon: 'ðŸ’¬',
      title: 'Message sans match',
      description: 'Contactez quelqu\'un sans correspondance prÃ©alable',
      premium: true,
    },
    {
      icon: 'ðŸ“Š',
      title: 'Statistiques dÃ©taillÃ©es',
      description: 'Analyser vos vues et likes reÃ§us',
      premium: true,
    },
    {
      icon: 'ðŸŒ',
      title: 'Rayon illimitÃ©',
      description: 'Recherchez au-delÃ  de 50km',
      premium: true,
    },
    {
      icon: 'ðŸŽšï¸',
      title: 'Filtres avancÃ©s',
      description: 'CritÃ¨res de recherche plus prÃ©cis',
      premium: true,
    },
    {
      icon: 'âœ¨',
      title: 'Profil stylisÃ©',
      description: 'Badge premium visible par tous',
      premium: true,
    },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      // Open Stripe checkout link
      const stripeLink = 'https://buy.stripe.com/28EbJ3fFFbdBflCd4LcMM07';
      const canOpen = await Linking.canOpenURL(stripeLink);

      if (canOpen) {
        await Linking.openURL(stripeLink);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir le lien de paiement. Veuillez rÃ©essayer.'
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'accÃ¨s au paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement restore purchase logic
      Alert.alert(
        'Restaurer',
        'Restauration des achats en cours. Feature coming soon!',
        [{ text: 'OK', onPress: () => setIsProcessing(false) }]
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Erreur', 'Impossible de restaurer l\'achat');
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
                <Text style={styles.statusTitle}>Vous Ãªtes Premium ! ðŸŽ‰</Text>
                {subscriptionInfo.daysRemaining !== undefined && (
                  <Text style={styles.statusSubtitle}>
                    Renouvellement dans {subscriptionInfo.daysRemaining} jours
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>GÃ©rer l'abonnement</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Price Section */}
          {!isPremium && (
            <View style={[styles.card, styles.priceCard]}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceLabel}>AccÃ¨s Premium</Text>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>MEILLEURE VALEUR</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>12,99</Text>
                <Text style={styles.priceCurrency}>$</Text>
                <Text style={styles.pricePeriod}>/mois</Text>
              </View>

              <Text style={styles.priceDescription}>Essai gratuit 7 jours â€¢ Annulation facile</Text>

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
                    <Text style={styles.subscribeButtonText}>Passer Premium</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Security Badges */}
              <View style={styles.securityContainer}>
                <View style={styles.securityBadge}>
                  <Ionicons name="lock-closed" size={16} color={Colors.success} />
                  <Text style={styles.securityText}>Paiement sÃ©curisÃ©</Text>
                </View>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                  <Text style={styles.securityText}>CryptÃ© SSL</Text>
                </View>
              </View>

              <View style={styles.trustContainer}>
                <Text style={styles.trustIcon}>ðŸ”’</Text>
                <Text style={styles.trustText}>Stripe â€¢ Paiement 100% sÃ©curisÃ©</Text>
              </View>

              {!isPremium && (
                <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
                  <Text style={styles.restoreLink}>Restaurer l'achat</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>FonctionnalitÃ©s Premium</Text>

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
              <Text style={styles.faqQuestion}>â“ Puis-je annuler mon abonnement ?</Text>
              <Text style={styles.faqAnswer}>
                Oui, vous pouvez annuler votre abonnement Ã  tout moment. Aucune pÃ©nalitÃ©.
              </Text>
            </View>

            <View style={[styles.card, styles.faqItem]}>
              <Text style={styles.faqQuestion}>â“ Comment Ã§a marche l'essai gratuit ?</Text>
              <Text style={styles.faqAnswer}>
                7 jours gratuits, puis renouvellement automatique. Vous pouvez annuler avant la fin de la pÃ©riode d'essai.
              </Text>
            </View>

            <View style={[styles.card, styles.faqItem]}>
              <Text style={styles.faqQuestion}>â“ Puis-je changer de plan ?</Text>
              <Text style={styles.faqAnswer}>
                Bien sÃ»r ! Vous pouvez mettre Ã  jour ou rÃ©trograder Ã  tout moment.
              </Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              En vous abonnant, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text> et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialitÃ©</Text>
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

