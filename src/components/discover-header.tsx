import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { FilterPanel } from './filter-panel';
import { createEntranceAnimation, createPressAnimation } from '@/utils/animations';

interface DiscoverHeaderProps {
  onNotificationsPress: () => void;
}

/* eslint-disable react-hooks/refs */
export function DiscoverHeader({ onNotificationsPress }: DiscoverHeaderProps) {
  const entranceAnimRef = useRef(createEntranceAnimation(400));
  const notificationButtonAnimRef = useRef(createPressAnimation());

  useEffect(() => {
    entranceAnimRef.current.animate();
  }, []);

  return (
    <RNAnimated.View
      style={[
        styles.header,
        {
          opacity: entranceAnimRef.current.opacity,
          transform: [{ translateY: entranceAnimRef.current.translateY }],
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/logon.jpeg')}
          style={styles.logo}
        />
        <Text style={styles.logoText}>nearme</Text>
      </View>
      <View style={styles.headerActions}>
        <FilterPanel />
        <RNAnimated.View
          style={{
            transform: [{ scale: notificationButtonAnimRef.current.scale }],
          }}
        >
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={onNotificationsPress}
            onPressIn={notificationButtonAnimRef.current.onPressIn}
            onPressOut={notificationButtonAnimRef.current.onPressOut}
          >
            <Ionicons name="notifications" size={24} color={Colors.text} />
          </TouchableOpacity>
        </RNAnimated.View>
      </View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
