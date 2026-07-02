import { View, ScrollView, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { LANGUAGES, COUNTRIES } from '@/constants/locales';
import { useLocalization } from '@/context/localization-context';

export default function LanguageCountryScreen() {
  const router = useRouter();
  const { next = 'register' } = useLocalSearchParams<{ next: string }>();
  const { language, country, setLanguage, setCountry, t } = useLocalization();

  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [selectedCountry, setSelectedCountry] = useState<string>(country);
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const query = countrySearch.toLowerCase();
    return COUNTRIES.filter((c) => c.label.toLowerCase().includes(query));
  }, [countrySearch]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await setLanguage(selectedLanguage);
      await setCountry(selectedCountry);
      const nextPath = next === 'login' ? '/auth/login' : '/auth/register';
      router.replace(nextPath);
    } catch (error) {
      console.error('Error saving localization:', error);
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await setLanguage('fr');
      await setCountry('FR');
      const nextPath = next === 'login' ? '/auth/login' : '/auth/register';
      router.replace(nextPath);
    } catch (error) {
      console.error('Error saving localization:', error);
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('welcome')}</Text>
            <Text style={styles.subtitle}>{t('selectLanguage')} â€¢ {t('selectCountry')}</Text>
          </View>

          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.sectionLabel}>{t('language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() => setSelectedLanguage(item.code)}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.languageFlag}>{item.flag}</Text>
                    <View style={styles.languageTextContainer}>
                      <Text style={styles.languageLabel}>{item.label}</Text>
                      <Text style={styles.languageNative}>{item.nativeLabel}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedLanguage === item.code && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedLanguage === item.code && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={[styles.card, Shadows.soft]}>
            <Text style={styles.sectionLabel}>{t('country')}</Text>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchCountry')}
                placeholderTextColor={Colors.textSecondary}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => setSelectedCountry(item.code)}
                >
                  <View style={styles.countryContent}>
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryLabel}>{item.label}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedCountry === item.code && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedCountry === item.code && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleConfirm}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>{t('skip')}</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  header: {
    marginBottom: Spacing.six,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: Spacing.four,
    marginBottom: Spacing.five,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.four,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.three,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  languageNative: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 14,
    color: Colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  buttonContainer: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  primaryButtonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  primaryButton: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

