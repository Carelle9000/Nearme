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
              Nous vous accordons une licence limitÃ©e, non exclusive et rÃ©vocable pour utiliser nearme conformÃ©ment Ã  ces conditions. Vous ne pouvez pas reproduire, vendre ou exploiter notre application Ã  des fins commerciales.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Compte utilisateur</Text>
            <Text style={styles.text}>
              Vous Ãªtes responsable de :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Maintenir la confidentialitÃ© de votre mot de passe</Text>
              <Text style={styles.listItem}>â€¢ Toutes les activitÃ©s de votre compte</Text>
              <Text style={styles.listItem}>â€¢ Informer nearme de tout accÃ¨s non autorisÃ©</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Comportement utilisateur</Text>
            <Text style={styles.text}>
              Vous acceptez de ne pas :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Harceler, intimider ou menacer d'autres utilisateurs</Text>
              <Text style={styles.listItem}>â€¢ Partager du contenu illÃ©gal ou offensant</Text>
              <Text style={styles.listItem}>â€¢ Escroquer ou tromper d'autres utilisateurs</Text>
              <Text style={styles.listItem}>â€¢ Spammer ou abuseR de la plateforme</Text>
              <Text style={styles.listItem}>â€¢ Utiliser l'application Ã  des fins illÃ©gales</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Contenu utilisateur</Text>
            <Text style={styles.text}>
              Vous conservez les droits sur le contenu que vous publiez. En partageant du contenu, vous nous accordez le droit de l'utiliser, de le reproduire et de l'afficher dans nearme.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation de responsabilitÃ©</Text>
            <Text style={styles.text}>
              nearme est fourni "tel quel" sans garanties. Nous ne sommes pas responsables des :
            </Text>
            <View style={styles.list}>
              <Text style={styles.listItem}>â€¢ Dommages indirects ou accidentels</Text>
              <Text style={styles.listItem}>â€¢ Perte de donnÃ©es ou profits</Text>
              <Text style={styles.listItem}>â€¢ Interruptions du service</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Modification du service</Text>
            <Text style={styles.text}>
              Nous pouvons modifier ou cesser nearme Ã  tout moment. Nous nous efforcerons de vous informer de tout changement important.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. RÃ©siliation</Text>
            <Text style={styles.text}>
              Nous pouvons rÃ©silier votre compte si vous violez ces conditions d'utilisation ou la loi. Vous pouvez supprimer votre compte Ã  tout moment.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Modification des conditions</Text>
            <Text style={styles.text}>
              Nous pouvons modifier ces conditions Ã  tout moment. Les modifications entrent en vigueur immÃ©diatement. Votre utilisation continue de nearme constitue votre acceptation des conditions modifiÃ©es.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Droit applicable</Text>
            <Text style={styles.text}>
              Ces conditions sont rÃ©gies par les lois de la France. Tout diffÃ©rend sera soumis aux tribunaux compÃ©tents.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.text}>
              Pour toute question concernant ces conditions, veuillez nous contacter Ã  : legal@nearme.app
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

