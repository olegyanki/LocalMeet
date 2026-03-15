import { pluralizeUk, pluralizeEn, getPluralSuffix } from '../../src/shared/utils/pluralization';

describe('Pluralization Utils', () => {
  describe('pluralizeUk', () => {
    test('should return "one" form for 1', () => {
      expect(pluralizeUk(1, 'учасник', 'учасника', 'учасників')).toBe('учасник');
    });

    test('should return "one" form for 21, 31, 41, etc.', () => {
      expect(pluralizeUk(21, 'учасник', 'учасника', 'учасників')).toBe('учасник');
      expect(pluralizeUk(31, 'учасник', 'учасника', 'учасників')).toBe('учасник');
      expect(pluralizeUk(101, 'учасник', 'учасника', 'учасників')).toBe('учасник');
    });

    test('should return "few" form for 2-4', () => {
      expect(pluralizeUk(2, 'учасник', 'учасника', 'учасників')).toBe('учасника');
      expect(pluralizeUk(3, 'учасник', 'учасника', 'учасників')).toBe('учасника');
      expect(pluralizeUk(4, 'учасник', 'учасника', 'учасників')).toBe('учасника');
    });

    test('should return "few" form for 22-24, 32-34, etc.', () => {
      expect(pluralizeUk(22, 'учасник', 'учасника', 'учасників')).toBe('учасника');
      expect(pluralizeUk(33, 'учасник', 'учасника', 'учасників')).toBe('учасника');
      expect(pluralizeUk(104, 'учасник', 'учасника', 'учасників')).toBe('учасника');
    });

    test('should return "many" form for 0, 5-20', () => {
      expect(pluralizeUk(0, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(5, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(10, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(20, 'учасник', 'учасника', 'учасників')).toBe('учасників');
    });

    test('should return "many" form for 11-14 (special case)', () => {
      expect(pluralizeUk(11, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(12, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(13, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(14, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(111, 'учасник', 'учасника', 'учасників')).toBe('учасників');
      expect(pluralizeUk(112, 'учасник', 'учасника', 'учасників')).toBe('учасників');
    });
  });

  describe('pluralizeEn', () => {
    test('should return "one" form for 1', () => {
      expect(pluralizeEn(1, 'participant', 'participants')).toBe('participant');
    });

    test('should return "other" form for 0, 2, 3, etc.', () => {
      expect(pluralizeEn(0, 'participant', 'participants')).toBe('participants');
      expect(pluralizeEn(2, 'participant', 'participants')).toBe('participants');
      expect(pluralizeEn(5, 'participant', 'participants')).toBe('participants');
      expect(pluralizeEn(21, 'participant', 'participants')).toBe('participants');
    });
  });

  describe('getPluralSuffix', () => {
    test('should return "_one" for English singular (1)', () => {
      expect(getPluralSuffix(1, 'en')).toBe('_one');
    });

    test('should return "_other" for English plural (not 1)', () => {
      expect(getPluralSuffix(0, 'en')).toBe('_other');
      expect(getPluralSuffix(2, 'en')).toBe('_other');
      expect(getPluralSuffix(5, 'en')).toBe('_other');
      expect(getPluralSuffix(21, 'en')).toBe('_other');
    });

    test('should return "_one" for Ukrainian singular', () => {
      expect(getPluralSuffix(1, 'uk')).toBe('_one');
      expect(getPluralSuffix(21, 'uk')).toBe('_one');
      expect(getPluralSuffix(101, 'uk')).toBe('_one');
    });

    test('should return "_few" for Ukrainian 2-4', () => {
      expect(getPluralSuffix(2, 'uk')).toBe('_few');
      expect(getPluralSuffix(3, 'uk')).toBe('_few');
      expect(getPluralSuffix(4, 'uk')).toBe('_few');
      expect(getPluralSuffix(22, 'uk')).toBe('_few');
    });

    test('should return "_many" for Ukrainian 0, 5-20, 11-14', () => {
      expect(getPluralSuffix(0, 'uk')).toBe('_many');
      expect(getPluralSuffix(5, 'uk')).toBe('_many');
      expect(getPluralSuffix(11, 'uk')).toBe('_many');
      expect(getPluralSuffix(12, 'uk')).toBe('_many');
      expect(getPluralSuffix(20, 'uk')).toBe('_many');
    });
  });
});
