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
import { Colors } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Politique de confidentialitÃ©</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.text}>
              nearme est engagÃ© Ã  protÃ©ger votre vie privÃ©e. Cette politique de confidentialitÃ© explique comment nous collectons, utilisons et protÃ©geons vos donnÃ©es personnelles.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. DonnÃ©es collectÃ©es</Text>
            <Text style={styles.text}>
              Nous collectons les informations suivantes :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Informations de compte (email, mot de passe)</Text>
              <Text style={styles.listItem}>â€¢ Profil utilisateur (nom, Ã¢ge, photo, bio, intÃ©rÃªts)</Text>
              <Text style={styles.listItem}>â€¢ Localisation (ville, coordonnÃ©es GPS)</Text>
              <Text style={styles.listItem}>â€¢ Historique de messages</Text>
              <Text style={styles.listItem}>â€¢ PrÃ©fÃ©rences et paramÃ¨tres</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Utilisation des donnÃ©es</Text>
            <Text style={styles.text}>
              Nous utilisons vos donnÃ©es pour :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Fournir et amÃ©liorer nos services</Text>
              <Text style={styles.listItem}>â€¢ Vous recommander des profils compatibles</Text>
              <Text style={styles.listItem}>â€¢ Assurer la sÃ©curitÃ© de votre compte</Text>
              <Text style={styles.listItem}>â€¢ Communiquer avec vous</Text>
              <Text style={styles.listItem}>â€¢ Respecter les obligations lÃ©gales</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Partage des donnÃ©es</Text>
            <Text style={styles.text}>
              Nous ne partageons pas vos donnÃ©es personnelles avec des tiers, sauf :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Pour respecter la loi ou une ordonnance judiciaire</Text>
              <Text style={styles.listItem}>â€¢ Pour protÃ©ger la sÃ©curitÃ© et les droits de nearme</Text>
              <Text style={styles.listItem}>â€¢ Avec votre consentement explicite</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. SÃ©curitÃ© des donnÃ©es</Text>
            <Text style={styles.text}>
              Nous implÃ©mentons des mesures de sÃ©curitÃ© techniques et organisationnelles pour protÃ©ger vos donnÃ©es contre l'accÃ¨s non autorisÃ©, la modification ou la divulgation.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Vos droits</Text>
            <Text style={styles.text}>
              Vous avez le droit de :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ AccÃ©der Ã  vos donnÃ©es personnelles</Text>
              <Text style={styles.listItem}>â€¢ Corriger les donnÃ©es inexactes</Text>
              <Text style={styles.listItem}>â€¢ Demander la suppression de vos donnÃ©es</Text>
              <Text style={styles.listItem}>â€¢ Vous opposer au traitement de vos donnÃ©es</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact</Text>
            <Text style={styles.text}>
              Pour toute question concernant cette politique de confidentialitÃ©, veuillez nous contacter Ã  : privacy@nearme.app
            </Text>
          </View>

          <View style={styles.lastUpdate}>
            <Text style={styles.lastUpdateText}>
              DerniÃ¨re mise Ã  jour : janvier 2026
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

