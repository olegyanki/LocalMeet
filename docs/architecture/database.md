# База даних

> PostgreSQL через Supabase. Міграції, RLS, тригери, RPC функції.

## Таблиці

### profiles
Профілі користувачів. Створюється при реєстрації.

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | = auth.uid() |
| first_name | TEXT | Ім'я |
| last_name | TEXT | Прізвище |
| bio | TEXT | Про себе |
| avatar_url | TEXT | URL аватарки |
| gender | TEXT | Стать |
| occupation | TEXT | Професія |
| interests | TEXT[] | Масив інтересів |
| languages | TEXT[] | Мови |
| social_instagram | TEXT | Instagram |
| social_telegram | TEXT | Telegram |

### walks
Події/прогулянки. Два типи: `event` (звичайна подія) і `live` (live-прогулянка).

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → profiles) | Автор |
| title | TEXT | Назва (NULL для live) |
| start_time | TIMESTAMPTZ | Час початку |
| duration | INTEGER | Тривалість **в секундах** |
| description | TEXT | Опис |
| latitude | DOUBLE PRECISION | Широта |
| longitude | DOUBLE PRECISION | Довгота |
| image_url | TEXT | URL обкладинки |
| type | TEXT | `'event'` або `'live'` |
| deleted | BOOLEAN | Soft delete |

### walk_requests
Запити на приєднання до події.

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | |
| walk_id | UUID (FK → walks) | Подія |
| requester_id | UUID (FK → profiles) | Хто просить |
| status | TEXT | `'pending'` / `'accepted'` / `'rejected'` |
| message | TEXT | Повідомлення від запитувача |

### chats
Чати. Три варіанти використання:
- `type = 'group'`, `walk_id != NULL` — груповий чат події
- `type = 'direct'`, `walk_id = NULL` — прямий чат 1-на-1

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | |
| type | TEXT | `'group'` або `'direct'` |
| walk_id | UUID (FK → walks, SET NULL) | Прив'язка до події |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### chat_participants
Учасники чатів. Junction table.

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | |
| chat_id | UUID (FK → chats, CASCADE) | |
| user_id | UUID (FK → profiles, CASCADE) | |
| role | TEXT | `'owner'` або `'member'` |
| joined_at | TIMESTAMPTZ | |
| UNIQUE(chat_id, user_id) | | |

### messages
Повідомлення в чатах.

| Поле | Тип | Опис |
|---|---|---|
| id | UUID (PK) | |
| chat_id | UUID (FK → chats, CASCADE) | |
| sender_id | UUID (FK → profiles) | |
| content | TEXT | Текст повідомлення |
| image_urls | TEXT[] | URL зображень |
| audio_url | TEXT | URL аудіо |
| read | BOOLEAN | Прочитано |
| created_at | TIMESTAMPTZ | |

## RPC функції

### get_nearby_walks(p_latitude, p_longitude, p_radius_km)
Повертає події в радіусі. Використовує `earth_distance` для геопошуку.

### get_nearby_walks_filtered(...)
Розширена версія з фільтрами: інтереси, час, максимальна відстань. Також повертає дані хоста. Опціональний параметр `p_user_id` — якщо передано, повертає `my_request_status` (статус запиту поточного користувача на кожну подію через LEFT JOIN на `walk_requests`).

### get_my_chats_optimized(p_user_id)
Оптимізований запит для списку чатів. Повертає все одним запитом: чат, учасники, останнє повідомлення, unread count. Також повертає `walk_user_id` (UUID автора події) для визначення ownership на клієнті. Фільтри:
1. Приховує чати прив'язані до видалених подій (`w.deleted = true`) або до неіснуючих подій (`w.id IS NULL` при `walk_id IS NOT NULL`)
2. Приховує порожні чати завершених live-подій (1 учасник, 0 повідомлень)

### get_chat_details(p_chat_id, p_user_id)
Деталі конкретного чату з учасниками та їх профілями.

### get_walks_by_user_id(p_user_id)
Всі активні події користувача.

## Тригери

### create_group_chat_on_walk_insert
Автоматично створює груповий чат при створенні звичайної події (`type = 'event'`). Для live-подій чат НЕ створюється (lazy creation).

### add_participant_on_request_accept
Додає учасника в чат при прийнятті walk request. Для live-подій також створює чат, якщо його ще немає.

### reset_walk_request_on_leave
Скидає статус walk request на `'pending'` коли учасник покидає чат.

### update_chat_timestamp
Оновлює `updated_at` чату при новому повідомленні.

## Storage Buckets

| Bucket | Для чого |
|---|---|
| `avatars` | Аватарки користувачів |
| `event-images` | Обкладинки подій |
| `chat-images` | Зображення в чатах |
| `chat-audio` | Аудіо повідомлення |

## Міграції

Всі зміни БД — через міграції в `supabase/migrations/`. Після кожної міграції потрібно перегенерувати типи:

```bash
npx supabase gen types typescript --local > src/shared/lib/database.types.ts
```

Детальніше: див. steering файл `database-workflow.md`.
