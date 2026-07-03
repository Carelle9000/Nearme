/* eslint-disable react-hooks/refs -- Animated values from React Native require ref access during render */
import React, { useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../models/user';
import { Colors, BorderRadius, Shadows } from '../constants/theme';
import {
  createEntranceAnimation,
  createPressAnimation,
  createPulseAnimation,
  createRotationAnimation,
  createStaggerAnimation,
} from '@/utils/animations';

interface ProfileCardProps {
  profile: Profile | null;
  isFavorite?: boolean;
  onLike?: () => void;
  onFavorite?: () => void;
  onMessage?: () => void;
}

interface FavoriteButtonProps {
  isFavorite: boolean;
  onFavorite: () => void;
}

const SWIPE_THRESHOLD = 40;

function FavoriteButton({ isFavorite, onFavorite }: FavoriteButtonProps) {
  const panRef = useRef(new RNAnimated.ValueXY());
  const pan = panRef.current;
  const rotationAnim = useRef(createRotationAnimation()).current;
  const pulseAnim = useRef(createPulseAnimation()).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavorite = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      rotationAnim.rotate();
      pulseAnim.pulse();
      onFavorite();
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: RNAnimated.event(
        [
          null,
          { dx: pan.x, dy: pan.y },
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, { dx, dy }) => {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > SWIPE_THRESHOLD && absX > absY) {
          handleFavorite();
        }

        RNAnimated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    });
  }, [handleFavorite, pan]);

  return (
    <RNAnimated.View
      style={[
        styles.favoriteButton,
        {
          transform: [
            { translateX: pan.x },
            {
              scale: RNAnimated.multiply(
                pan.x.interpolate({
                  inputRange: [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
                  outputRange: [1.05, 1, 1.05],
                }),
                pulseAnim.scale
              ),
            },
            { rotate: rotationAnim.rotation.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            })},
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.favoriteButtonTouchable}
        onPress={handleFavorite}
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={24}
          color={Colors.primary}
        />
      </TouchableOpacity>
    </RNAnimated.View>
  );
}
/* eslint-enable react-hooks/refs */

const { width, height } = Dimensions.get('window');

export function ProfileCard({
  profile,
  isFavorite = false,
  onLike,
  onFavorite,
  onMessage,
}: ProfileCardProps) {
  const entranceAnimRef = useRef(createEntranceAnimation());
  const messageButtonAnimRef = useRef(createPressAnimation());
  const likeButtonAnimRef = useRef(createPressAnimation());
  const staggerAnimRef = useRef(createStaggerAnimation(4, 100));

  const entranceAnim = entranceAnimRef.current;
  const messageButtonAnim = messageButtonAnimRef.current;
  const likeButtonAnim = likeButtonAnimRef.current;
  const staggerAnim = staggerAnimRef.current;

  useEffect(() => {
    entranceAnim.animate();
    staggerAnim.animateAll();
  }, [profile?.uid]);

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No more profiles</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
        </View>
      </View>
    );
  }

  const age = profile.birthDate
    ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
    : '?';

  return (
    <View style={styles.container}>
      <RNAnimated.View
        style={[
          styles.card,
          {
            transform: [
              { scale: entranceAnim.scale },
              { translateY: entranceAnim.translateY },
            ],
            opacity: entranceAnim.opacity,
          },
        ]}
      >
        {/* Profile Photo */}
        <Image
          source={{
            uri: profile.photoUrl || 'https://via.placeholder.com/400x500?text=No+Photo',
          }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Dark Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(30, 17, 23, 0.9)']}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <RNAnimated.View
            style={[
              styles.nameRow,
              {
                opacity: staggerAnim.animations[0].opacity,
                transform: [{ translateX: staggerAnim.animations[0].translateX }],
              },
            ]}
          >
            <Text style={styles.name}>
              {profile.displayName || profile.name}, {age}
            </Text>
            {isFavorite && <Ionicons name="star" size={20} color={Colors.primary} />}
          </RNAnimated.View>

          {profile.location?.city && (
            <RNAnimated.View
              style={[
                styles.locationRow,
                {
                  opacity: staggerAnim.animations[1].opacity,
                  transform: [{ translateX: staggerAnim.animations[1].translateX }],
                },
              ]}
            >
              <Ionicons name="location-sharp" size={14} color={Colors.accent} />
              <Text style={styles.location}>{profile.location.city}</Text>
            </RNAnimated.View>
          )}

          {profile.bio && (
            <RNAnimated.View
              style={{
                opacity: staggerAnim.animations[2].opacity,
                transform: [{ translateX: staggerAnim.animations[2].translateX }],
              }}
            >
              <Text style={styles.bio}>{profile.bio}</Text>
            </RNAnimated.View>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <RNAnimated.View
              style={[
                styles.interestsRow,
                {
                  opacity: staggerAnim.animations[3].opacity,
                  transform: [{ translateX: staggerAnim.animations[3].translateX }],
                },
              ]}
            >
              {profile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </RNAnimated.View>
          )}
        </View>
      </RNAnimated.View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <RNAnimated.View
          style={{
            transform: [{ scale: messageButtonAnim.scale }],
          }}
        >
          <TouchableOpacity
            style={styles.messageButton}
            onPress={onMessage}
            onPressIn={messageButtonAnim.onPressIn}
            onPressOut={messageButtonAnim.onPressOut}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </RNAnimated.View>

        {onFavorite && (
          <FavoriteButton isFavorite={isFavorite} onFavorite={onFavorite} />
        )}

        <RNAnimated.View
          style={{
            transform: [{ scale: likeButtonAnim.scale }],
          }}
        >
          <LinearGradient
            colors={[Colors.primary, '#C82E42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.likeButtonGradient}
          >
            <TouchableOpacity
              style={styles.likeButton}
              onPress={onLike}
              onPressIn={likeButtonAnim.onPressIn}
              onPressOut={likeButtonAnim.onPressOut}
            >
              <Ionicons name="heart" size={28} color={Colors.text} />
            </TouchableOpacity>
          </LinearGradient>
        </RNAnimated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: width - 32,
    height: height * 0.65,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
    ...Shadows.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  infoSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.accent,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(245, 165, 181, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 181, 0.3)',
  },
  interestText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    ...Shadows.soft,
  },
  favoriteButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.soft,
  },
  favoriteButtonTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  likeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
