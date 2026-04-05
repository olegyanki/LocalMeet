# ADR-001: Lazy Chat Creation для Live Events

## Статус: Прийнято

## Контекст

При створенні regular event, груповий чат створюється автоматично тригером. Коли ми додали live events, постало питання: чи створювати чат одразу?

Проблема: більшість live-прогулянок можуть не отримати жодного запиту на приєднання. Створення порожнього чату для кожної live-прогулянки засмічує список чатів і БД.

## Рішення

Lazy (відкладене) створення чатів для live events:

1. При створенні live walk — чат НЕ створюється
2. Чат створюється в одному з двох випадків:
   - DB тригер `add_participant_on_request_accept` створює чат при першому accepted request
   - `getOrCreateChatForWalk(walkId, userId)` створює чат коли owner відкриває його вручну
3. Порожні чати завершених live events фільтруються в RPC `get_my_chats_optimized`

## Альтернативи

1. **Створювати чат одразу** (як для regular events) — відхилено через засмічення
2. **Не створювати чат взагалі** — відхилено, бо owner може захотіти відкрити чат до першого запиту
3. **Видаляти порожні чати** — відхилено, бо складніше і може мати side effects

## Наслідки

- Потрібна перевірка `walk.type` в тригері створення чату
- `getOrCreateChatForWalk` має бути ідемпотентною
- UI має обробляти випадок коли чату ще не існує
- Фільтрація в RPC додає складності, але зберігає чистоту списку чатів

## Міграції
- `supabase/migrations/*_skip_chat_creation_for_live_walks.sql`
- `supabase/migrations/*_modify_add_participant_trigger_lazy_chat.sql`
- `supabase/migrations/*_update_get_my_chats_add_creator_fields_and_live_filter.sql`
