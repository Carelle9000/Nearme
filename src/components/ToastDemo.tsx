import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { useToast } from '@/context/toast-context';
import { Colors, BorderRadius } from '@/constants/theme';

/**
 * Composant de démonstration du système de toast
 * À utiliser uniquement en développement
 */
export function ToastDemo() {
  const { success, error, warning, info, show, clear } = useToast();

  const demoButtons = [
    {
      title: 'Toast Success',
      onPress: () => success('Opération réussie !'),
      color: '#10B981',
    },
    {
      title: 'Toast Error',
      onPress: () => error('Une erreur s\'est produite'),
      color: '#EF4444',
    },
    {
      title: 'Toast Warning',
      onPress: () => warning('Attention : Veuillez vérifier'),
      color: '#F59E0B',
    },
    {
      title: 'Toast Info',
      onPress: () => info('Information importante'),
      color: '#3B82F6',
    },
    {
      title: 'Toast Personnalisé (5s)',
      onPress: () => show('Message personnalisé avec durée plus longue', 'info', 5000),
      color: '#8B5CF6',
    },
    {
      title: 'Toast Message Long',
      onPress: () =>
        success(
          'Ceci est un message plus long pour démontrer comment les toasts gèrent le texte plus volumineux'
        ),
      color: '#10B981',
    },
    {
      title: 'Toast Sans Fermeture Auto (0s)',
      onPress: () => info('Ce toast ne disparaît pas automatiquement. Cliquez pour fermer.', 0),
      color: '#3B82F6',
    },
    {
      title: 'Tous les toasts',
      onPress: () => {
        success('Success');
        error('Error', 4000);
        warning('Warning', 3500);
      },
      color: '#EC4899',
    },
    {
      title: 'Effacer tous les toasts',
      onPress: () => clear(),
      color: '#6B7280',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Démonstration Toast</Text>
        <Text style={styles.headerSubtitle}>Cliquez sur un bouton pour tester</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {demoButtons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.demoButton, { backgroundColor: button.color }]}
            onPress={button.onPress}
          >
            <Text style={styles.demoButtonText}>{button.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Utilisation dans votre code:</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`import { useToast } from '@/context/toast-context';\n\nconst { success, error, warning, info } = useToast();\n\n// Afficher un toast de succès\nsuccess('Opération réussie !');\n\n// Afficher un toast d'erreur\nerror('Une erreur s\'est produite');\n\n// Afficher un toast d'avertissement\nwarning('Attention');\n\n// Afficher un toast informatif\ninfo('Information');`}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  demoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.base,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  code: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
