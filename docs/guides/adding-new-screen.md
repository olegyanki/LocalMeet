# Як додати новий екран

> Мінімальний гайд для створення нового екрану.

## 1. Визнач де буде екран

| Потреба | Де створювати | Tab bar |
|---|---|---|
| Новий таб | `app/(tabs)/screen.tsx` | Видно |
| Вкладений в таб | `app/(tabs)/(group)/screen.tsx` | Видно |
| Окремий екран | `app/screen/[id].tsx` + `_layout.tsx` | Приховано |

## 2. Створи screen компонент

```
src/features/my-feature/screens/MyScreen.tsx
```

Мінімальний шаблон:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@shared/i18n';
import { COLORS, SIZES } from '@shared/constants';

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SIZES.SCREEN_TOP_PADDING },
      ]}
    >
      <Text style={styles.title}>{t('screenTitle')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SECONDARY,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
});
```

## 3. Створи route файл

```tsx
// app/(tabs)/my-screen.tsx або app/my-screen/index.tsx
import MyScreen from '@features/my-feature/screens/MyScreen';
export default MyScreen;
```

## 4. Якщо екран поза табами — додай layout

```tsx
// app/my-screen/_layout.tsx
import { Stack } from 'expo-router';
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

## 5. Додай переклади

Не забудь додати ключі в `uk.json` і `en.json`.
