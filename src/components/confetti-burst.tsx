import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';

interface ConfettiBurstProps {
  trigger: boolean;
  count?: number;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

interface Confetti {
  id: string;
  x: number;
  rotation: RNAnimated.Value;
  translateY: RNAnimated.Value;
  translateX: RNAnimated.Value;
  opacity: RNAnimated.Value;
}

export function ConfettiBurst({
  trigger,
  count = 20,
  onComplete,
}: ConfettiBurstProps) {
  const [confettis, setConfettis] = React.useState<Confetti[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newConfettis: Confetti[] = Array.from({ length: count }).map((_, i) => {
      const rotation = new RNAnimated.Value(Math.random() * 360);
      const translateY = new RNAnimated.Value(0);
      const translateX = new RNAnimated.Value(0);
      const opacity = new RNAnimated.Value(1);

      return {
        id: `confetti-${i}`,
        x: Math.random() * 60 - 30,
        rotation,
        translateY,
        translateX,
        opacity,
      };
    });

    const stateTimer = setTimeout(() => {
      setConfettis(newConfettis);
    }, 0);

    const animationTimer = setTimeout(() => {
      newConfettis.forEach((confetti, i) => {
        const angle = (i / count) * Math.PI * 2;
        const velocity = 150 + Math.random() * 100;
        const endX = Math.cos(angle) * velocity;
        const endY = Math.sin(angle) * velocity + 200;

        RNAnimated.parallel([
          RNAnimated.timing(confetti.translateY, {
            toValue: -endY,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(confetti.translateX, {
            toValue: endX,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          RNAnimated.timing(confetti.opacity, {
            toValue: 0,
            duration: 1200 + Math.random() * 300,
            useNativeDriver: true,
          }),
          RNAnimated.timing(confetti.rotation, {
            toValue: 360,
            duration: 1200 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 0);

    const cleanupTimer = setTimeout(() => {
      setConfettis([]);
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(stateTimer);
      clearTimeout(animationTimer);
      clearTimeout(cleanupTimer);
    };
  }, [trigger, count, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {confettis.map((confetti, index) => (
        <RNAnimated.View
          key={confetti.id}
          style={[
            styles.piece,
            {
              transform: [
                { translateY: confetti.translateY },
                { translateX: confetti.translateX },
                {
                  rotate: confetti.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: confetti.opacity,
              backgroundColor:
                index % 3 === 0
                  ? Colors.primary
                  : index % 3 === 1
                    ? Colors.accent
                    : Colors.secondary,
            },
          ]}
        />
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
  piece: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
