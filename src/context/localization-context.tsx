import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localizationService } from '../services/localization.service';
import { TRANSLATIONS } from '../constants/locales';

interface LocalizationContextType {
  language: string;
  country: string;
  hasConfigured: boolean;
  isLoading: boolean;
  setLanguage: (code: string) => Promise<void>;
  setCountry: (code: string) => Promise<void>;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('fr');
  const [country, setCountryState] = useState<string>('FR');
  const [hasConfigured, setHasConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadLocalization = async () => {
      try {
        const savedLanguage = await localizationService.getLanguage();
        const savedCountry = await localizationService.getCountry();

        if (savedLanguage) {
          setLanguageState(savedLanguage);
          setHasConfigured(true);
        }
        if (savedCountry) {
          setCountryState(savedCountry);
        }
      } catch (error) {
        console.error('Error loading localization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalization();
  }, []);

  const setLanguage = async (code: string) => {
    try {
      await localizationService.setLanguage(code);
      setLanguageState(code);
      setHasConfigured(true);
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  };

  const setCountry = async (code: string) => {
    try {
      await localizationService.setCountry(code);
      setCountryState(code);
    } catch (error) {
      console.error('Error setting country:', error);
      throw error;
    }
  };

  const t = (key: string): string => {
    const translations = TRANSLATIONS[language as keyof typeof TRANSLATIONS];
    if (!translations) {
      const fallbackTranslations = TRANSLATIONS['en' as keyof typeof TRANSLATIONS];
      return (fallbackTranslations[key as keyof typeof fallbackTranslations] as string) || key;
    }
    return (translations[key as keyof typeof translations] as string) || key;
  };

  return (
    <LocalizationContext.Provider
      value={{
        language,
        country,
        hasConfigured,
        isLoading,
        setLanguage,
        setCountry,
        t,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
