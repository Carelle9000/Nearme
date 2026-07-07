import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/context/toast-context';
import { Toast, ToastType } from '@/types/toast';
import { Colors } from '@/constants/theme';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const TOAST_COLORS: Record<ToastType, { bg: string; icon: string; color: string }> = {
  success: {
    bg: '#10B981',
    icon: 'checkmark-circle',
    color: '#fff',
  },
  error: {
    bg: '#EF4444',
    icon: 'close-circle',
    color: '#fff',
  },
  info: {
    bg: '#3B82F6',
    icon: 'information-circle',
    color: '#fff',
  },
  warning: {
    bg: '#F59E0B',
    icon: 'alert-circle',
    color: '#fff',
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent, { dy }: PanResponderGestureState) => {
        if (dy < 0) {
          slideAnim.setValue(dy);
          opacityAnim.setValue(1 + dy / 100);
        }
      },
      onPanResponderRelease: (evt: GestureResponderEvent, { dy }: PanResponderGestureState) => {
        if (dy < -50) {
          onDismiss(toast.id);
        } else {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, slideAnim, opacityAnim, onDismiss]);

  const config = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.toast, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
        <Text style={[styles.message, { color: config.color }]}>{toast.message}</Text>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onDismiss(toast.id)}
        >
          <Ionicons name="close" size={20} color={config.color} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 0,
    gap: 8,
  },
  toastContainer: {
    marginVertical: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
