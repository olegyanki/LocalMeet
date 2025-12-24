import uk from './locales/uk.json';
import en from './locales/en.json';

export const translations = {
  uk,
  en,
};

export type Language = 'uk' | 'en';
export type TranslationKey = keyof typeof uk;
