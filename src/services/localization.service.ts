import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  language: 'app_language',
  country: 'app_country',
};

export const localizationService = {
  async getLanguage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.language);
    } catch (error) {
      console.error('Error getting language:', error);
      return null;
    }
  },

  async setLanguage(code: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.language, code);
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  },

  async getCountry(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.country);
    } catch (error) {
      console.error('Error getting country:', error);
      return null;
    }
  },

  async setCountry(code: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.country, code);
    } catch (error) {
      console.error('Error setting country:', error);
      throw error;
    }
  },

  async isLanguageConfigured(): Promise<boolean> {
    const language = await this.getLanguage();
    return language !== null && language !== '';
  },

  async clearLocalization(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.language),
        AsyncStorage.removeItem(KEYS.country),
      ]);
    } catch (error) {
      console.error('Error clearing localization:', error);
      throw error;
    }
  },
};
