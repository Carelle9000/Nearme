import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

/* eslint-disable react-hooks/refs */
export function ProfileCardSkeleton() {
  const shimmerValueRef = useRef(new RNAnimated.Value(0));
  const shimmerValue = shimmerValueRef.current;

  useEffect(() => {
    const shimmerAnimation = () => {
      shimmerValue.setValue(0);
      RNAnimated.loop(
        RNAnimated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    };

    shimmerAnimation();
  }, []);

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.container}>
      <RNAnimated.View
        style={[
          styles.card,
          {
            opacity: shimmerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['#3D2B2B', '#4A3A3A', '#3D2B2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.skeletonPhoto}
        />

        <LinearGradient
          colors={['transparent', 'rgba(30, 17, 23, 0.9)']}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />

        {/* Info Section Skeleton */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <View style={styles.skeletonName} />
          </View>

          <View style={styles.locationRow}>
            <View style={styles.skeletonText} />
          </View>

          <View style={styles.bioRow}>
            <View style={[styles.skeletonText, { width: '100%' }]} />
            <View style={[styles.skeletonText, { width: '80%', marginTop: 8 }]} />
          </View>

          <View style={styles.interestsRow}>
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
            <View style={styles.skeletonTag} />
          </View>
        </View>
      </RNAnimated.View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actionsContainer}>
        <View style={styles.skeletonButton} />
        <View style={styles.skeletonButton} />
        <View style={styles.skeletonButton} />
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
  skeletonPhoto: {
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
    marginBottom: 12,
  },
  skeletonName: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    width: 150,
  },
  locationRow: {
    marginBottom: 12,
  },
  bioRow: {
    marginBottom: 12,
  },
  skeletonText: {
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    width: '70%',
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  skeletonTag: {
    height: 28,
    width: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  skeletonButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
