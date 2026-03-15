# Pluralization Guide

## Overview

This project supports proper pluralization for both Ukrainian and English languages.

## How It Works

### Ukrainian (3 forms)
Ukrainian has 3 plural forms based on the number:
- **one**: 1, 21, 31, 41, 51, 61, 71, 81, 91, 101, 121... (ends with 1, but not 11)
- **few**: 2-4, 22-24, 32-34, 42-44... (ends with 2-4, but not 12-14)
- **many**: 0, 5-20, 25-30, 35-40... (ends with 0, 5-9, or 11-14)

### English (2 forms)
English has 2 plural forms:
- **singular**: 1
- **plural**: 0, 2, 3, 4, 5... (everything except 1)

## Translation Files

### Ukrainian (`src/shared/i18n/locales/uk.json`)
```json
{
  "participantsCount_one": "{{count}} учасник",
  "participantsCount_few": "{{count}} учасника",
  "participantsCount_many": "{{count}} учасників"
}
```

### English (`src/shared/i18n/locales/en.json`)
```json
{
  "participantsCount_one": "{{count}} participant",
  "participantsCount_other": "{{count}} participants"
}
```

## Usage in Components

```tsx
import { useI18n } from '@shared/i18n';
import { getPluralSuffix } from '@shared/utils/pluralization';

function MyComponent() {
  const { t, locale } = useI18n();
  const participantCount = 5;

  return (
    <Text>
      {t(`participantsCount${getPluralSuffix(participantCount, locale)}` as any, { 
        count: participantCount 
      })}
    </Text>
  );
}
```

### Examples

**Ukrainian:**
```tsx
t(`participantsCount${getPluralSuffix(1, 'uk')}`, { count: 1 })   // "1 учасник"
t(`participantsCount${getPluralSuffix(2, 'uk')}`, { count: 2 })   // "2 учасника"
t(`participantsCount${getPluralSuffix(5, 'uk')}`, { count: 5 })   // "5 учасників"
t(`participantsCount${getPluralSuffix(21, 'uk')}`, { count: 21 }) // "21 учасник"
t(`participantsCount${getPluralSuffix(22, 'uk')}`, { count: 22 }) // "22 учасника"
t(`participantsCount${getPluralSuffix(25, 'uk')}`, { count: 25 }) // "25 учасників"
```

**English:**
```tsx
t(`participantsCount${getPluralSuffix(1, 'en')}`, { count: 1 })  // "1 participant"
t(`participantsCount${getPluralSuffix(2, 'en')}`, { count: 2 })  // "2 participants"
t(`participantsCount${getPluralSuffix(5, 'en')}`, { count: 5 })  // "5 participants"
t(`participantsCount${getPluralSuffix(21, 'en')}`, { count: 21 }) // "21 participants"
```

## Adding New Pluralized Strings

### Step 1: Add translations

**Ukrainian** (`uk.json`):
```json
{
  "requestsCount_one": "{{count}} запит",
  "requestsCount_few": "{{count}} запити",
  "requestsCount_many": "{{count}} запитів"
}
```

**English** (`en.json`):
```json
{
  "requestsCount_one": "{{count}} request",
  "requestsCount_other": "{{count}} requests"
}
```

### Step 2: Use in component

```tsx
const { t, locale } = useI18n();
const requestCount = 3;

<Text>
  {t(`requestsCount${getPluralSuffix(requestCount, locale)}` as any, { 
    count: requestCount 
  })}
</Text>
```

## Utility Functions

### `getPluralSuffix(count: number, locale: 'uk' | 'en'): string`

Returns the appropriate suffix for translation keys:
- Ukrainian: `'_one'`, `'_few'`, or `'_many'`
- English: `'_one'` or `'_other'`

### `pluralizeUk(count: number, one: string, few: string, many: string): string`

Directly returns the correct Ukrainian plural form:
```tsx
pluralizeUk(1, 'учасник', 'учасника', 'учасників')  // "учасник"
pluralizeUk(2, 'учасник', 'учасника', 'учасників')  // "учасника"
pluralizeUk(5, 'учасник', 'учасника', 'учасників')  // "учасників"
```

### `pluralizeEn(count: number, one: string, other: string): string`

Directly returns the correct English plural form:
```tsx
pluralizeEn(1, 'participant', 'participants')  // "participant"
pluralizeEn(5, 'participant', 'participants')  // "participants"
```

## Testing

Run pluralization tests:
```bash
npm test -- --testPathPattern="pluralization"
```

## Common Patterns

### Participant Count
```tsx
{t(`participantsCount${getPluralSuffix(count, locale)}` as any, { count })}
```

### Request Count
```tsx
{t(`requestsCount${getPluralSuffix(count, locale)}` as any, { count })}
```

### Message Count
```tsx
{t(`messagesCount${getPluralSuffix(count, locale)}` as any, { count })}
```

## Type Safety Note

We use `as any` to bypass TypeScript's strict type checking for dynamic translation keys. This is intentional and safe because:
1. The translation keys are validated at runtime
2. Missing translations fall back to the key itself
3. The pattern is consistent across the codebase

## References

- Ukrainian plural rules: [CLDR Plural Rules](https://www.unicode.org/cldr/charts/43/supplemental/language_plural_rules.html)
- Implementation: `src/shared/utils/pluralization.ts`
- Tests: `__tests__/utils/pluralization.test.ts`
