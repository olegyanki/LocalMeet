# Дебагінг

> Типові проблеми та як їх вирішувати.

## Supabase / БД

### "function does not exist"
**Причина**: RPC функція не знайдена.
**Рішення**: Перевір `search_path` у визначенні функції. Додай `SET search_path TO 'public'`.

### "column reference is ambiguous"
**Причина**: Однакові назви колонок в JOIN без аліасів.
**Рішення**: Використовуй аліаси таблиць: `SELECT t.column_name FROM table t`.

### Типи не відповідають БД
**Причина**: Типи не перегенеровані після міграції.
**Рішення**:
```bash
npx supabase gen types typescript --local > src/shared/lib/database.types.ts
```

### RLS блокує запит
**Причина**: Row Level Security policy не дозволяє операцію.
**Рішення**: Перевір policies для таблиці. Переконайся що `auth.uid()` відповідає очікуванням.

## React Native / Expo

### Keyboard перекриває інпут
**Причина**: Немає `KeyboardAvoidingView` або неправильний `behavior`.
**Рішення**:
```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
```

### Tab bar перекриває контент
**Причина**: Немає `paddingBottom` з урахуванням tab bar.
**Рішення**:
```tsx
paddingBottom: isKeyboardVisible ? 20 : SIZES.TAB_BAR_HEIGHT + 20
```

### Екран не оновлюється після навігації назад
**Причина**: React Navigation кешує екрани.
**Рішення**: Використовуй `useFocusEffect` замість `useEffect` для завантаження даних.

## Real-time

### Підписка не працює
**Причина**: Канал не підключений або RLS блокує.
**Рішення**:
1. Перевір що `supabase.channel().subscribe()` повертає `SUBSCRIBED`
2. Перевір RLS policies для таблиці
3. Перевір що Realtime увімкнений для таблиці в Supabase Dashboard

### Дублювання повідомлень
**Причина**: Підписка не відписується при unmount.
**Рішення**: Завжди `supabase.removeChannel(channel)` в cleanup useEffect.

## Загальне

### "Cannot find module '@shared/...'"
**Причина**: Path alias не налаштований.
**Рішення**: Перевір `babel.config.js` і `tsconfig.json`.

### Expo build fails
```bash
npx expo start --clear    # Очистити кеш
rm -rf node_modules && npm install  # Перевстановити залежності
```
