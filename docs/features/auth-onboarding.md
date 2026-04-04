# Авторизація та онбордінг

> Supabase Auth для авторизації. Онбордінг для заповнення профілю після реєстрації.

## Auth Flow

```
Відкриття додатку
  → AuthContext перевіряє сесію
  → Є сесія? → Перевірка профілю
    → Профіль заповнений? → Головний екран
    → Профіль не заповнений? → Онбордінг
  → Немає сесії? → Login екран
```

### Реєстрація
1. Email + пароль через Supabase Auth
2. Створення запису в `profiles` (тригер або вручну)
3. Перенаправлення на онбордінг

### Логін
1. Email + пароль
2. Supabase повертає сесію
3. AuthContext завантажує профіль
4. Перенаправлення на головний екран

## AuthContext

```tsx
const { user, profile, isLoading, refreshProfile } = useAuth();
```

| Поле | Тип | Опис |
|---|---|---|
| `user` | User \| null | Supabase auth user |
| `profile` | UserProfile \| null | Профіль з БД |
| `isLoading` | boolean | Завантаження сесії |
| `refreshProfile()` | function | Перезавантажити профіль |

## Онбордінг

Після реєстрації юзер заповнює профіль:
- Ім'я, прізвище
- Стать
- Професія
- Інтереси
- Мови
- Аватарка
- Соціальні мережі (Instagram, Telegram)

## Ключові файли

| Файл | Опис |
|---|---|
| `src/shared/contexts/AuthContext.tsx` | Auth контекст |
| `src/shared/lib/auth.ts` | Auth helpers |
| `src/features/auth/screens/login.tsx` | Екран логіну |
| `src/features/auth/screens/register.tsx` | Екран реєстрації |
| `src/features/onboarding/` | Онбордінг |
| `app/auth/_layout.tsx` | Layout для auth екранів |
