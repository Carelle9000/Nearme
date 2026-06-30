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
import { Colors, BorderRadius } from '../../constants/theme';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
            <Text style={styles.text}>
              En utilisant nearme, vous acceptez ces conditions d'utilisation. Si vous ne les acceptez pas, veuillez ne pas utiliser notre application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Licence d'utilisation</Text>
            <Text style={styles.text}>
              Nous vous accordons une licence limitée, non exclusive et révocable pour utiliser nearme conformément à ces conditions. Vous ne pouvez pas reproduire, vendre ou exploiter notre application à des fins commerciales.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Compte utilisateur</Text>
            <Text style={styles.text}>
              Vous êtes responsable de :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Maintenir la confidentialité de votre mot de passe</Text>
              <Text style={styles.listItem}>• Toutes les activités de votre compte</Text>
              <Text style={styles.listItem}>• Informer nearme de tout accès non autorisé</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Comportement utilisateur</Text>
            <Text style={styles.text}>
              Vous acceptez de ne pas :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Harceler, intimider ou menacer d'autres utilisateurs</Text>
              <Text style={styles.listItem}>• Partager du contenu illégal ou offensant</Text>
              <Text style={styles.listItem}>• Escroquer ou tromper d'autres utilisateurs</Text>
              <Text style={styles.listItem}>• Spammer ou abuseR de la plateforme</Text>
              <Text style={styles.listItem}>• Utiliser l'application à des fins illégales</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Contenu utilisateur</Text>
            <Text style={styles.text}>
              Vous conservez les droits sur le contenu que vous publiez. En partageant du contenu, vous nous accordez le droit de l'utiliser, de le reproduire et de l'afficher dans nearme.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation de responsabilité</Text>
            <Text style={styles.text}>
              nearme est fourni "tel quel" sans garanties. Nous ne sommes pas responsables des :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>• Dommages indirects ou accidentels</Text>
              <Text style={styles.listItem}>• Perte de données ou profits</Text>
              <Text style={styles.listItem}>• Interruptions du service</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Modification du service</Text>
            <Text style={styles.text}>
              Nous pouvons modifier ou cesser nearme à tout moment. Nous nous efforcerons de vous informer de tout changement important.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Résiliation</Text>
            <Text style={styles.text}>
              Nous pouvons résilier votre compte si vous violez ces conditions d'utilisation ou la loi. Vous pouvez supprimer votre compte à tout moment.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Modification des conditions</Text>
            <Text style={styles.text}>
              Nous pouvons modifier ces conditions à tout moment. Les modifications entrent en vigueur immédiatement. Votre utilisation continue de nearme constitue votre acceptation des conditions modifiées.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Droit applicable</Text>
            <Text style={styles.text}>
              Ces conditions sont régies par les lois de la France. Tout différend sera soumis aux tribunaux compétents.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.text}>
              Pour toute question concernant ces conditions, veuillez nous contacter à : legal@nearme.app
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
