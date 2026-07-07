import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  cancelText = 'Annuler',
  confirmText = 'Confirmer',
  isDangerous = false,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onCancel}
        activeOpacity={1}
      />
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                isDangerous && styles.dangerButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} size="small" />
              ) : (
                <Text style={[styles.confirmButtonText, isDangerous && styles.dangerButtonText]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  modalContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    ...Shadows.card,
    position: 'relative' as any,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: '#E74C3C',
  },
  confirmButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  dangerButtonText: {
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
