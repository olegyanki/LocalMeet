import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { I18nProvider, useI18n } from '../../src/shared/i18n';

describe('I18n Pluralization Integration', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  describe('English pluralization', () => {
    test('should use correct English plural forms', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      // Set language to English
      result.current.setLanguage('en');
      
      // Test singular
      const singular = result.current.t('participantsCount_one' as any, { count: 1 });
      expect(singular).toBe('1 participant');
      
      // Test plural
      const plural = result.current.t('participantsCount_other' as any, { count: 5 });
      expect(plural).toBe('5 participants');
    });
  });

  describe('Ukrainian pluralization', () => {
    test('should use correct Ukrainian plural forms', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });
      
      // Set language to Ukrainian
      result.current.setLanguage('uk');
      
      // Test one (1, 21, 31...)
      const one = result.current.t('participantsCount_one' as any, { count: 1 });
      expect(one).toBe('1 учасник');
      
      const twentyOne = result.current.t('participantsCount_one' as any, { count: 21 });
      expect(twentyOne).toBe('21 учасник');
      
      // Test few (2-4, 22-24...)
      const few = result.current.t('participantsCount_few' as any, { count: 2 });
      expect(few).toBe('2 учасника');
      
      const twentyTwo = result.current.t('participantsCount_few' as any, { count: 22 });
      expect(twentyTwo).toBe('22 учасника');
      
      // Test many (0, 5-20, 11-14...)
      const many = result.current.t('participantsCount_many' as any, { count: 5 });
      expect(many).toBe('5 учасників');
      
      const eleven = result.current.t('participantsCount_many' as any, { count: 11 });
      expect(eleven).toBe('11 учасників');
    });
  });
});
