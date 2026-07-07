import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { useLocalization } from '../context/localization-context';

interface PremiumRequiredModalProps {
  visible: boolean;
  featureName?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

/**
 * PremiumRequiredModal: Shows when user tries to access a premium feature
 * Displays paywall with feature info and upgrade button
 */
export function PremiumRequiredModal({
  visible,
  featureName,
  onClose,
  onUpgrade,
}: PremiumRequiredModalProps) {
  const { t } = useLocalization();

  const getFeatureIcon = (feature?: string): string => {
    const iconMap: Record<string, string> = {
      'view_who_liked': '👀',
      'message_without_match': '💬',
      'undo': '🔄',
      'advanced_filters': '🎚️',
      'unlimited_search_radius': '🌍',
      'profile_analytics': '📊',
      'priority_messages': '⭐',
      'styled_profile': '✨',
    };
    return iconMap[feature || ''] || '🔒';
  };

  const getFeatureTitle = (feature?: string): string => {
    const titleMap: Record<string, string> = {
      'view_who_liked': t('premiumFeatureLikes'),
      'message_without_match': t('premiumFeatureMessage'),
      'undo': t('premiumFeatureUndo'),
      'advanced_filters': t('premiumFeatureFilters'),
      'unlimited_search_radius': t('premiumFeatureRadius'),
      'profile_analytics': t('premiumFeatureStats'),
      'priority_messages': t('premiumFeatureFeatured'),
      'styled_profile': t('premiumFeatureProfile'),
    };
    return titleMap[feature || ''] || t('premiumFeatureFeatured');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.featureIcon}>{getFeatureIcon(featureName)}</Text>
            <Text style={styles.title}>{getFeatureTitle(featureName)}</Text>
          </View>

          {/* Feature Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.description}>
              {t('premiumRequiredMessage')}
            </Text>
          </View>

          {/* Benefits Preview */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>{t('withPremiumYouCan')}</Text>
            <BenefitItem icon="👀" text={t('premiumFeatureLikesDesc')} />
            <BenefitItem icon="💬" text={t('premiumFeatureMessageDesc')} />
            <BenefitItem icon="🔄" text={t('premiumFeatureUndoDesc')} />
            <BenefitItem icon="📊" text={t('premiumFeatureStatsDesc')} />
            <BenefitItem icon="🌍" text={t('premiumFeatureRadiusDesc')} />
          </View>

          {/* Price Tag */}
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.priceSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.price}>{t('premiumPrice')}</Text>
            <Text style={styles.priceDesc}>{t('premiumTrial')}</Text>
          </LinearGradient>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.upgradeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.upgradeButtonText}>
                {t('premiumGo') || 'Passer au Premium'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BenefitItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.benefitItem}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.cardSurface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    padding: Spacing.two,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
    marginTop: Spacing.two,
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: Spacing.four,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.three,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: Spacing.two,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  priceSection: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: Spacing.one,
  },
  priceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderRadius: BorderRadius.base,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  laterButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
