/**
 * Get correct plural form for Ukrainian language
 * Ukrainian has 3 plural forms:
 * - one: 1, 21, 31, 41, 51, 61, 71, 81, 91, 101, 121, etc. (ends with 1, but not 11)
 * - few: 2-4, 22-24, 32-34, etc. (ends with 2-4, but not 12-14)
 * - many: 0, 5-20, 25-30, etc. (ends with 0, 5-9, or 11-14)
 * 
 * @param count - Number to determine plural form
 * @param one - Form for 1 (e.g., "учасник")
 * @param few - Form for 2-4 (e.g., "учасника")
 * @param many - Form for 5+ (e.g., "учасників")
 * @returns Correct plural form
 * 
 * @example
 * pluralizeUk(1, 'учасник', 'учасника', 'учасників') // "учасник"
 * pluralizeUk(2, 'учасник', 'учасника', 'учасників') // "учасника"
 * pluralizeUk(5, 'учасник', 'учасника', 'учасників') // "учасників"
 * pluralizeUk(21, 'учасник', 'учасника', 'учасників') // "учасник"
 */
export const pluralizeUk = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  // Ends with 11-14 (special case)
  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }

  // Ends with 1 (but not 11)
  if (mod10 === 1) {
    return one;
  }

  // Ends with 2-4 (but not 12-14)
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  // Everything else (0, 5-9, 11-14)
  return many;
};

/**
 * Get correct plural form for English language
 * English has 2 plural forms:
 * - one: 1
 * - other: 0, 2, 3, 4, 5, etc.
 * 
 * @param count - Number to determine plural form
 * @param one - Form for 1 (e.g., "participant")
 * @param other - Form for other (e.g., "participants")
 * @returns Correct plural form
 * 
 * @example
 * pluralizeEn(1, 'participant', 'participants') // "participant"
 * pluralizeEn(2, 'participant', 'participants') // "participants"
 * pluralizeEn(0, 'participant', 'participants') // "participants"
 */
export const pluralizeEn = (
  count: number,
  one: string,
  other: string
): string => {
  return count === 1 ? one : other;
};

/**
 * Get correct plural form based on current locale
 * Automatically detects language and uses appropriate pluralization rules
 * 
 * @param count - Number to determine plural form
 * @param locale - Current locale ('uk' or 'en')
 * @param forms - Object with plural forms for each language
 * @returns Correct plural form for current locale
 * 
 * @example
 * pluralize(1, 'uk', {
 *   uk: { one: 'учасник', few: 'учасника', many: 'учасників' },
 *   en: { one: 'participant', other: 'participants' }
 * }) // "учасник"
 * 
 * pluralize(5, 'uk', {
 *   uk: { one: 'учасник', few: 'учасника', many: 'учасників' },
 *   en: { one: 'participant', other: 'participants' }
 * }) // "учасників"
 */
export const pluralize = (
  count: number,
  locale: 'uk' | 'en',
  forms: {
    uk: { one: string; few: string; many: string };
    en: { one: string; other: string };
  }
): string => {
  if (locale === 'uk') {
    return pluralizeUk(count, forms.uk.one, forms.uk.few, forms.uk.many);
  } else {
    return pluralizeEn(count, forms.en.one, forms.en.other);
  }
};

/**
 * Get correct translation key suffix for plural forms
 * Used with i18n translation keys that have _one, _few, _many suffixes
 * 
 * @param count - Number to determine plural form
 * @param locale - Current locale ('uk' or 'en')
 * @returns Suffix for translation key
 * 
 * @example
 * // Ukrainian
 * const key = `participantsCount${getPluralSuffix(1, 'uk')}`; // "participantsCount_one"
 * const key = `participantsCount${getPluralSuffix(5, 'uk')}`; // "participantsCount_many"
 * 
 * // English
 * const key = `participantsCount${getPluralSuffix(1, 'en')}`; // "participantsCount_one"
 * const key = `participantsCount${getPluralSuffix(5, 'en')}`; // "participantsCount_other"
 */
export const getPluralSuffix = (count: number, locale: 'uk' | 'en'): string => {
  if (locale === 'en') {
    return count === 1 ? '_one' : '_other';
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  // Ends with 11-14 (special case)
  if (mod100 >= 11 && mod100 <= 14) {
    return '_many';
  }

  // Ends with 1 (but not 11)
  if (mod10 === 1) {
    return '_one';
  }

  // Ends with 2-4 (but not 12-14)
  if (mod10 >= 2 && mod10 <= 4) {
    return '_few';
  }

  // Everything else (0, 5-9, 11-14)
  return '_many';
};
