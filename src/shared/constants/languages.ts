export interface Language {
  code: string;
  nameKey: string; // Translation key for language name
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'uk', nameKey: 'langUkrainian', flag: '🇺🇦' },
  { code: 'en', nameKey: 'langEnglish', flag: '🇬🇧' },
  { code: 'es', nameKey: 'langSpanish', flag: '🇪🇸' },
  { code: 'fr', nameKey: 'langFrench', flag: '🇫🇷' },
  { code: 'de', nameKey: 'langGerman', flag: '🇩🇪' },
  { code: 'it', nameKey: 'langItalian', flag: '🇮🇹' },
  { code: 'pt', nameKey: 'langPortuguese', flag: '🇵🇹' },
  { code: 'ja', nameKey: 'langJapanese', flag: '🇯🇵' },
  { code: 'zh', nameKey: 'langChinese', flag: '🇨🇳' },
  { code: 'ko', nameKey: 'langKorean', flag: '🇰🇷' },
  { code: 'ar', nameKey: 'langArabic', flag: '🇸🇦' },
  { code: 'ru', nameKey: 'langRussian', flag: '🇷🇺' },
  { code: 'pl', nameKey: 'langPolish', flag: '🇵🇱' },
  { code: 'tr', nameKey: 'langTurkish', flag: '🇹🇷' },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find((lang) => lang.code === code);
};
