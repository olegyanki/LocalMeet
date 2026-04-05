# Огляд архітектури

> LocalMeet — мобільний додаток для пошуку людей поруч та організації спільних прогулянок/подій.

## Tech Stack

| Технологія | Версія | Для чого |
|---|---|---|
| React Native + Expo | 54.0.10 | Мобільний фреймворк |
| TypeScript | — | Типізація |
| Supabase | — | PostgreSQL, Auth, Storage, Real-time |
| Leaflet (WebView) | — | Карта (через WebView) |
| Mapbox style | — | Стиль тайлів карти |
| Expo Router | — | File-based навігація |

## Структура проєкту

```
src/
├── features/              # Фіча-модулі (кожна фіча ізольована)
│   ├── auth/              # Авторизація (login, register)
│   ├── chats/             # Чати (список, екран чату)
│   ├── events/            # Створення подій
│   ├── event-details/     # Деталі події
│   ├── live/              # Live-прогулянки
│   ├── onboarding/        # Онбордінг нових користувачів
│   ├── profile/           # Профіль, налаштування
│   └── search/            # Карта + пошук подій
└── shared/                # Спільні ресурси
    ├── components/        # Переиспользовувані UI компоненти
    ├── constants/         # Кольори, стилі, розміри
    ├── contexts/          # React контексти (Auth, CreateEvent)
    ├── hooks/             # Кастомні хуки
    ├── i18n/              # Інтернаціоналізація (uk, en)
    ├── lib/               # API, auth, Supabase клієнт
    │   └── api/           # API модулі (chats, walks, profiles, etc.)
    └── utils/             # Допоміжні функції
```

## Принципи архітектури

### Feature-based модулі
Кожна фіча — ізольований модуль зі своїми screens, components, hooks. Фічі не імпортують одна одну напряму — спільний код живе в `shared/`.

### Path aliases
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`

### API шар
Весь доступ до Supabase йде через `src/shared/lib/api/`. Компоненти ніколи не викликають `supabase` напряму.

```
src/shared/lib/
├── api.ts              # Re-export всіх API функцій
├── api/
│   ├── badges.ts       # Badge counts, real-time subscriptions
│   ├── chats.ts        # CRUD чатів, getMyChats, getChatDetails
│   ├── messages.ts     # Повідомлення, read status
│   ├── profiles.ts     # Профілі користувачів
│   ├── storage.ts      # Завантаження зображень
│   ├── walk-requests.ts # Запити на приєднання
│   └── walks.ts        # CRUD подій, nearby walks
├── auth.ts             # Auth helpers
├── database.types.ts   # Автогенеровані типи з Supabase
└── supabase.ts         # Supabase client instance
```

### Типізація
TypeScript типи для БД генеруються автоматично з Supabase schema → `database.types.ts`. API модулі визначають свої інтерфейси (`Walk`, `Chat`, `UserProfile`, etc.) і маплять RPC результати.

## Потік даних

```
Екран (Screen)
  → використовує хук (useChatData, useChatsData, etc.)
    → хук викликає API функцію (getMyChats, sendMessage, etc.)
      → API функція робить запит до Supabase (RPC або query)
        → Supabase повертає дані
      → API маппить результат у типізований інтерфейс
    → хук зберігає в state
  → екран рендерить дані
```

Real-time оновлення йдуть через Supabase channels (postgres_changes) і підписки в хуках.
