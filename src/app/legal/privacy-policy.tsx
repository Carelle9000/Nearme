import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Politique de confidentialité</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.text}>
              nearme est engagé à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Données collectées</Text>
            <Text style={styles.text}>
              Nous collectons les informations suivantes :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Informations de compte (email, mot de passe)</Text>
              <Text style={styles.listItem}>• Profil utilisateur (nom, âge, photo, bio, intérêts)</Text>
              <Text style={styles.listItem}>• Localisation (ville, coordonnées GPS)</Text>
              <Text style={styles.listItem}>• Historique de messages</Text>
              <Text style={styles.listItem}>• Préférences et paramètres</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
            <Text style={styles.text}>
              Nous utilisons vos données pour :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Fournir et améliorer nos services</Text>
              <Text style={styles.listItem}>• Vous recommander des profils compatibles</Text>
              <Text style={styles.listItem}>• Assurer la sécurité de votre compte</Text>
              <Text style={styles.listItem}>• Communiquer avec vous</Text>
              <Text style={styles.listItem}>• Respecter les obligations légales</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Partage des données</Text>
            <Text style={styles.text}>
              Nous ne partageons pas vos données personnelles avec des tiers, sauf :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Pour respecter la loi ou une ordonnance judiciaire</Text>
              <Text style={styles.listItem}>• Pour protéger la sécurité et les droits de nearme</Text>
              <Text style={styles.listItem}>• Avec votre consentement explicite</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Sécurité des données</Text>
            <Text style={styles.text}>
              Nous implémentons des mesures de sécurité techniques et organisationnelles pour protéger vos données contre l'accès non autorisé, la modification ou la divulgation.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Vos droits</Text>
            <Text style={styles.text}>
              Vous avez le droit de :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Accéder à vos données personnelles</Text>
              <Text style={styles.listItem}>• Corriger les données inexactes</Text>
              <Text style={styles.listItem}>• Demander la suppression de vos données</Text>
              <Text style={styles.listItem}>• Vous opposer au traitement de vos données</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact</Text>
            <Text style={styles.text}>
              Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à : privacy@nearme.app
            </Text>
          </View>

          <View style={styles.lastUpdate}>
            <Text style={styles.lastUpdateText}>
              Dernière mise à jour : janvier 2026
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  list: {
    marginLeft: 8,
    gap: 4,
  },
  listItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  lastUpdate: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 24,
  },
  lastUpdateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
