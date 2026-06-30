import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onDismiss, onRetry }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="alert-circle" size={20} color="#FF1744" />
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF1744',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#FF1744',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: '#FF1744',
    fontWeight: '600',
    fontSize: 14,
  },
});
