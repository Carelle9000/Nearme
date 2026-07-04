import { Animated as RNAnimated, Easing } from 'react-native';

/**
 * Animation Utilities - Centralized animation configurations
 * Using RNAnimated for stable, performant animations
 */

// ============= ENTRANCE ANIMATIONS =============

export const createEntranceAnimation = (duration: number = 600) => {
  const scale = new RNAnimated.Value(0.9);
  const opacity = new RNAnimated.Value(0);
  const translateY = new RNAnimated.Value(40);

  const animate = () => {
    RNAnimated.parallel([
      RNAnimated.timing(scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    scale,
    opacity,
    translateY,
    animate,
  };
};

// ============= BUTTON INTERACTIONS =============

export const createPulseAnimation = () => {
  const scale = new RNAnimated.Value(1);

  const pulse = () => {
    scale.setValue(1);
    RNAnimated.sequence([
      RNAnimated.timing(scale, {
        toValue: 1.15,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, pulse };
};

export const createPressAnimation = () => {
  const scale = new RNAnimated.Value(1);

  const onPressIn = () => {
    RNAnimated.timing(scale, {
      toValue: 0.92,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    RNAnimated.timing(scale, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
};

// ============= SWIPE ANIMATIONS =============

export const createSwipeExitAnimation = (direction: 'left' | 'right') => {
  const translateX = new RNAnimated.Value(0);
  const opacity = new RNAnimated.Value(1);
  const rotation = new RNAnimated.Value(0);

  const animate = () => {
    const targetX = direction === 'left' ? -400 : 400;
    const targetRotation = direction === 'left' ? -20 : 20;

    RNAnimated.parallel([
      RNAnimated.timing(translateX, {
        toValue: targetX,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(rotation, {
        toValue: targetRotation,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    translateX,
    opacity,
    rotation,
    animate,
  };
};

// ============= STAGGER ANIMATIONS =============

export const createStaggerAnimation = (itemCount: number, staggerDelay: number = 100) => {
  const animations = Array.from({ length: itemCount }).map(() => ({
    opacity: new RNAnimated.Value(0),
    translateX: new RNAnimated.Value(-20),
  }));

  const animateAll = () => {
    const sequenceArray = animations.map((anim) => {
      return RNAnimated.parallel([
        RNAnimated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        RNAnimated.timing(anim.translateX, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    });

    RNAnimated.stagger(staggerDelay, sequenceArray).start();
  };

  return {
    animations,
    animateAll,
  };
};

// ============= FLOATING HEARTS ANIMATION =============

export const createFloatingHeartAnimation = () => {
  const translateY = new RNAnimated.Value(0);
  const opacity = new RNAnimated.Value(1);
  const scale = new RNAnimated.Value(1);

  const animate = () => {
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);

    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: -200,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: 1200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 1.5,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    translateY,
    opacity,
    scale,
    animate,
  };
};

// ============= ROTATION ANIMATION =============

export const createRotationAnimation = () => {
  const rotation = new RNAnimated.Value(0);

  const rotate = () => {
    rotation.setValue(0);
    RNAnimated.timing(rotation, {
      toValue: 360,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return {
    rotation,
    rotate,
  };
};

// ============= SHIMMER LOADING ANIMATION =============

export const createShimmerAnimation = () => {
  const shimmer = new RNAnimated.Value(0);

  const startShimmer = () => {
    shimmer.setValue(0);
    RNAnimated.loop(
      RNAnimated.timing(shimmer, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  };

  return {
    shimmer,
    startShimmer,
  };
};

// ============= GLOW ANIMATION =============

export const createGlowAnimation = () => {
  const glow = new RNAnimated.Value(0);

  const startGlow = () => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(glow, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return {
    glow,
    startGlow,
  };
};
