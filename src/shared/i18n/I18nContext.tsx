import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uk');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('language');
      if (saved === 'uk' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch (err) {
      console.error('Failed to load language:', err);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (err) {
      console.error('Failed to save language:', err);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, any>): string => {
    let translation = translations[language][key] || key;
    
    // Replace {{param}} with actual values
    if (params) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(
          new RegExp(`{{${param}}}`, 'g'),
          String(params[param])
        );
      });
    }
    
    return translation;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
