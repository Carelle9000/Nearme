import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { createFloatingHeartAnimation } from '@/utils/animations';

interface FloatingHeart {
  id: string;
  x: number;
  animation: ReturnType<typeof createFloatingHeartAnimation>;
}

interface FloatingHeartsProps {
  trigger: boolean;
  count?: number;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

export function FloatingHearts({
  trigger,
  count = 5,
  onComplete,
}: FloatingHeartsProps) {
  const [hearts, setHearts] = React.useState<FloatingHeart[]>([]);
  const heartsRef = useRef<FloatingHeart[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newHearts: FloatingHeart[] = Array.from({ length: count }).map(
      (_, i) => {
        const animation = createFloatingHeartAnimation();
        animation.animate();

        return {
          id: `heart-${Date.now()}-${i}`,
          x: Math.random() * 60 - 30,
          animation,
        };
      }
    );

    heartsRef.current = newHearts;

    const stateTimer = setTimeout(() => {
      setHearts(newHearts);
    }, 0);

    const timer = setTimeout(() => {
      setHearts([]);
      heartsRef.current = [];
      onComplete?.();
    }, 1300);

    return () => {
      clearTimeout(stateTimer);
      clearTimeout(timer);
    };
  }, [trigger, count, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {hearts.map((heart) => (
        <RNAnimated.View
          key={heart.id}
          style={[
            styles.heart,
            {
              transform: [
                { translateY: heart.animation.translateY },
                { translateX: heart.x },
                { scale: heart.animation.scale },
              ],
              opacity: heart.animation.opacity,
            },
          ]}
        >
          <Ionicons name="heart" size={32} color={Colors.primary} />
        </RNAnimated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  heart: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
