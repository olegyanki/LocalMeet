# ADR-002: Real-time Badge Subscriptions

## Статус: Прийнято

## Контекст

Потрібно показувати badge counts (непрочитані повідомлення, нові запити) на табах. Є два підходи: polling (періодичні запити) або real-time subscriptions.

## Рішення

Real-time subscriptions через Supabase channels:

1. Підписка на `postgres_changes` для таблиць: `messages`, `walk_requests`, `chat_participants`
2. При зміні — оновлення badge count
3. Fallback: refresh при поверненні додатку з фону (app state change)
4. 5-хвилинний кеш для уникнення зайвих API запитів

## Альтернативи

1. **Polling кожні N секунд** — відхилено через зайве навантаження на БД і затримку оновлень
2. **Push notifications** — додатковий, але не замінює real-time (юзер може бути в додатку)

## Наслідки

- Миттєві оновлення badge counts
- Мінімальне навантаження на БД (тільки при реальних змінах)
- Потрібно правильно відписуватися при unmount
- Кеш запобігає race conditions при швидких змінах

## Ключові файли
- `src/shared/lib/api/badges.ts` — `getBadgeCounts()`, `setupBadgeSubscriptions()`
