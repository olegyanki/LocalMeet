# Авторизація та онбордінг

> Supabase Auth (email + password) для авторизації.

## Auth Flow

```
Відкриття додатку
  → AuthContext перевіряє сесію
  → Є сесія? → Головний екран (tabs)
  → Немає сесії? → Екран реєстрації (/auth/register)
```

### Реєстрація
1. Email + пароль через Supabase Auth (`/auth/register`)
2. Supabase створює запис в `auth.users`
3. DB тригер створює запис в `profiles`
4. Перенаправлення на головний екран

### Логін
1. Email + пароль (`/auth/index`)
2. Supabase повертає сесію
3. AuthContext завантажує профіль
4. Перенаправлення на головний екран

## Навігація між екранами

- Перший екран — реєстрація (`/auth/register`)
- З реєстрації → логін: `router.push('/auth')` (є back)
- З логіну → реєстрація: `router.back()`
- Після успішного входу/реєстрації: `router.replace('/(tabs)')`
- Якщо немає сесії в tabs: `router.replace('/auth/register')`

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

## Ключові файли

| Файл | Опис |
|---|---|
| `src/shared/contexts/AuthContext.tsx` | Auth контекст |
| `src/shared/lib/auth.ts` | signUp, signIn, signOut, onAuthStateChange |
| `src/features/auth/screens/AuthScreen.tsx` | Екран логіну |
| `src/features/auth/screens/register.tsx` | Екран реєстрації |
| `app/auth/index.tsx` | Route → AuthScreen |
| `app/auth/register.tsx` | Route → RegisterScreen |
| `app/auth/_layout.tsx` | Stack: register (перший) → index |
