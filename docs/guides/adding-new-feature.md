# Як додати нову фічу

> Покроковий гайд для додавання нової фічі в LocalMeet.

## 1. Створи структуру папок

```
src/features/my-feature/
├── screens/
│   └── MyFeatureScreen.tsx
├── components/          # тільки якщо є 2+ компоненти
│   └── MyFeatureCard.tsx
└── hooks/               # тільки якщо є кастомні хуки
    └── useMyFeatureData.ts
```

## 2. Якщо потрібні зміни в БД

1. Створи міграцію: `npx supabase migration new add_my_feature_table`
2. Напиши SQL в `supabase/migrations/`
3. Застосуй: `npx supabase db push`
4. Перегенеруй типи: `npx supabase gen types typescript --local > src/shared/lib/database.types.ts`
5. Додай API функції в `src/shared/lib/api/` (новий файл або існуючий)
6. Оновити re-export в `src/shared/lib/api.ts`

## 3. Створи екран

Використовуй стандартну структуру з `code-structure.md`:
- Hooks → State → Derived state → Effects → Handlers → Render
- `KeyboardAvoidingView` для форм
- Keyboard tracking для правильного padding

## 4. Додай навігацію

### Якщо екран в табах:
```
app/(tabs)/my-feature.tsx
```

### Якщо екран поза табами (без tab bar):
```
app/my-feature/
├── _layout.tsx
└── [id].tsx    # або index.tsx
```

Оновити `app/(tabs)/_layout.tsx` якщо потрібен новий таб.

## 5. Додай переклади

В обидва файли:
- `src/shared/i18n/locales/uk.json`
- `src/shared/i18n/locales/en.json`

## 6. Задокументуй

- Створи `docs/features/my-feature.md`
- Оновити `docs/README.md` (додати посилання)
- Якщо було нетривіальне рішення → створи ADR

## Чеклист

- [ ] Папка фічі створена
- [ ] Міграція (якщо потрібна)
- [ ] Типи перегенеровані
- [ ] API функції додані
- [ ] Екран створений
- [ ] Навігація налаштована
- [ ] Переклади додані (uk + en)
- [ ] Документація оновлена
