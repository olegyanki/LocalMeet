# Авторизація

> Supabase Auth (email + password) для авторизації.

## Auth Flow

```
Відкриття додатку
  → AuthContext перевіряє сесію
  → Є сесія? → Головний екран (tabs)
  → Немає сесії? → /auth (index вирішує куди)
      → hasLoggedInBefore = true → /auth/login
      → hasLoggedInBefore = false → /auth/register
```

### Реєстрація
1. Email + пароль через Supabase Auth (`/auth/register`)
2. Supabase створює запис в `auth.users`
3. DB тригер створює запис в `profiles`
4. `markLoggedIn()` зберігає флаг в AsyncStorage
5. Перенаправлення на головний екран

### Логін
1. Email + пароль (`/auth/login`)
2. Supabase повертає сесію
3. `markLoggedIn()` зберігає флаг в AsyncStorage
4. AuthContext завантажує профіль
5. Перенаправлення на головний екран

## authPreference — логіка першого екрану

`src/shared/lib/authPreference.ts` зберігає в AsyncStorage флаг `auth_has_logged_in`.

| Функція | Опис |
|---|---|
| `hasLoggedInBefore()` | Читає флаг, повертає `true` якщо юзер вже логінився |
| `markLoggedIn()` | Зберігає флаг після успішного логіну або реєстрації |

Логіка:
- **Перший запуск** (флаг відсутній) → `/auth/register`
- **Повторний запуск / після logout** (флаг є) → `/auth/login`

`app/auth/index.tsx` — router-екран, читає AsyncStorage і робить `replace` на потрібний екран.

## Навігація між екранами

- Logout / unauthenticated redirect → `router.replace('/auth')` (index вирішує куди)
- З реєстрації → логін: `router.canGoBack()` → `router.back()`, інакше `router.push('/auth/login')`
- З логіну → реєстрація: `router.canGoBack()` → `router.back()`, інакше `router.push('/auth/register')`
- Після успішного входу/реєстрації: `router.replace('/(tabs)')`

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
| `src/shared/lib/authPreference.ts` | hasLoggedInBefore, markLoggedIn (AsyncStorage флаг) |
| `src/features/auth/screens/LoginScreen.tsx` | Екран логіну |
| `src/features/auth/screens/register.tsx` | Екран реєстрації |
| `app/auth/index.tsx` | Router-екран: читає AsyncStorage → replace на login або register |
| `app/auth/login.tsx` | Route → LoginScreen |
| `app/auth/register.tsx` | Route → RegisterScreen |
| `app/auth/_layout.tsx` | Stack: index, login, register |
