import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { createPulseAnimation } from '@/utils/animations';

type ReactionType = 'like' | 'favorite' | 'message';

interface ReactionFeedbackProps {
  trigger: boolean;
  type: ReactionType;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

const reactionConfig = {
  like: {
    icon: 'heart',
    color: Colors.primary,
    duration: 600,
  },
  favorite: {
    icon: 'star',
    color: Colors.primary,
    duration: 500,
  },
  message: {
    icon: 'chatbubble-outline',
    color: Colors.accent,
    duration: 400,
  },
};

export function ReactionFeedback({
  trigger,
  type,
  position = { x: width / 2, y: height / 2 },
  onComplete,
}: ReactionFeedbackProps) {
  const scaleAnimRef = useRef(new RNAnimated.Value(1));
  const opacityAnimRef = useRef(new RNAnimated.Value(1));
  const config = reactionConfig[type];

  const scaleAnim = scaleAnimRef.current;
  const opacityAnim = opacityAnimRef.current;

  useEffect(() => {
    if (!trigger) return;

    scaleAnim.setValue(0.5);
    opacityAnim.setValue(1);

    RNAnimated.parallel([
      RNAnimated.timing(scaleAnim, {
        toValue: 1.2,
        duration: config.duration,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacityAnim, {
        toValue: 0,
        duration: config.duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [trigger, config.duration, onComplete]);

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <RNAnimated.View
        style={[
          styles.reaction,
          {
            left: position.x - 30,
            top: position.y - 30,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons
          name={config.icon as any}
          size={60}
          color={config.color}
        />
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  reaction: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
