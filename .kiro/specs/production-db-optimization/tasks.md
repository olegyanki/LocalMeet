# План імплементації: Production Database Optimization

## Огляд

Поетапна оптимізація Supabase-шару бази даних для LocalMeet. Три фази: RPC-функції → безпека/індекси → рефакторинг api.ts. Кожна міграція делегується агенту `supabase-expert`. Після кожної міграції — регенерація типів.

## Завдання

- [ ] 1. Фаза 1: Створення RPC-функцій
  - [x] 1.1 Створити міграцію та RPC-функцію `get_walks_by_user_id`
    - Створити SQL-міграцію з функцією `get_walks_by_user_id(p_user_id UUID)` згідно дизайну
    - Функція: `SECURITY DEFINER`, `SET search_path TO 'public'`, аліаси таблиць, фільтр `deleted = false`, сортування `start_time ASC`
    - Застосувати міграцію через `supabase-expert` агента
    - Регенерувати TypeScript-типи (`database.types.ts`)
    - _Вимоги: 1.1, 1.2, 1.4_

  - [x] 1.2 Оновити `getWalksByUserId` в api.ts на виклик RPC
    - Замінити `supabase.from('walks').select('*')` на `supabase.rpc('get_walks_by_user_id')`
    - Використати згенерований тип `Database['public']['Functions']['get_walks_by_user_id']['Returns'][number]`
    - Зберегти існуючу сигнатуру функції та тип повернення `Walk[]`
    - _Вимоги: 1.3_

  - [ ]* 1.3 Написати property-тест для `get_walks_by_user_id`
    - **Property 1: RPC get_walks_by_user_id повертає еквівалентні дані прямому запиту**
    - **Validates: Вимоги 1.1, 1.2**

  - [x] 1.4 Створити міграцію та RPC-функцію `get_walk_requests_for_owner`
    - Створити SQL-міграцію з функцією `get_walk_requests_for_owner(p_user_id UUID, p_status TEXT)` згідно дизайну
    - JOIN між `walk_requests`, `profiles`, `walks` в одному запиті (усунення N+1)
    - Фільтрація за `p_status`: `'pending'` → `wr.status = 'pending'`, `'past'` → `wr.status IN ('accepted', 'rejected')`
    - Сортування: pending → `created_at DESC`, past → `updated_at DESC`
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 2.1, 2.2, 2.3, 2.6_

  - [x] 1.5 Оновити функції walk_requests в api.ts на виклик RPC
    - Замінити `getMyWalkRequests` та `getPendingWalkRequests` однією функцією `getWalkRequests(userId, 'pending')`
    - Замінити `getPastWalkRequests` на виклик `get_walk_requests_for_owner` з `p_status = 'past'`
    - Використати згенеровані типи замість `any`
    - Оновити всі виклики цих функцій у компонентах
    - _Вимоги: 2.4, 2.5_

  - [ ]* 1.6 Написати property-тест для `get_walk_requests_for_owner`
    - **Property 2: RPC get_walk_requests_for_owner коректно фільтрує за статусом**
    - **Validates: Вимоги 2.1, 2.2, 2.3**

  - [x] 1.7 Створити міграцію та RPC-функцію `get_walk_participants`
    - Створити SQL-міграцію з функцією `get_walk_participants(p_walk_id UUID)` згідно дизайну
    - JOIN між `walk_requests` та `profiles`, фільтр `status = 'accepted'`
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 3.1, 3.2_

  - [x] 1.8 Оновити `getWalkParticipants` в api.ts на виклик RPC
    - Замінити прямий запит з вкладеним select на `supabase.rpc('get_walk_participants')`
    - Використати згенерований тип, зберегти сигнатуру `Promise<UserProfile[]>`
    - _Вимоги: 3.3_

  - [ ]* 1.9 Написати property-тест для `get_walk_participants`
    - **Property 3: RPC get_walk_participants повертає лише accepted учасників**
    - **Validates: Вимоги 3.1, 3.2**

  - [x] 1.10 Створити міграцію та RPC-функцію `get_chat_messages_cursor`
    - Створити SQL-міграцію з функцією `get_chat_messages_cursor(p_chat_id UUID, p_limit INTEGER, p_cursor TIMESTAMPTZ)` згідно дизайну
    - Курсорна пагінація: `p_cursor = NULL` → останні повідомлення, інакше → `created_at < p_cursor`
    - Поле `has_more BOOLEAN` для індикації наявності ще повідомлень
    - JOIN з `profiles` для даних відправника
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 4.1, 4.2, 4.3, 4.5_

  - [x] 1.11 Оновити `getChatMessages` в api.ts на курсорну пагінацію
    - Змінити сигнатуру: `offset?: number` → `cursor?: string`
    - Змінити тип повернення: `Promise<Message[]>` → `Promise<{ messages: Message[]; hasMore: boolean }>`
    - Замінити прямий запит на `supabase.rpc('get_chat_messages_cursor')`
    - Оновити всі виклики `getChatMessages` у компонентах (`useChatMessages.ts` та інші)
    - _Вимоги: 4.4_

  - [ ]* 1.12 Написати property-тест для курсорної пагінації
    - **Property 4: Курсорна пагінація повідомлень**
    - **Validates: Вимоги 4.1, 4.2, 4.3, 4.5**

- [x] 2. Checkpoint — Перевірка Фази 1
  - Ensure all tests pass, ask the user if questions arise.
  - Перевірити, що всі 4 RPC-функції створені та працюють
  - Перевірити, що api.ts використовує RPC замість прямих запитів

- [ ] 3. Фаза 2: Безпека, індекси та search_path
  - [x] 3.1 Створити міграцію для виправлення RLS-політик `auth.uid()` → `(select auth.uid())`
    - Оновити всі RLS-політики на таблицях `chats`, `messages`, `chat_participants`, що використовують bare `auth.uid()`
    - Замінити на `(select auth.uid())` для кешування результату
    - Зберегти ідентичну семантику доступу
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 5.1, 5.2, 5.3_

  - [ ]* 3.2 Написати property-тест для RLS auth.uid()
    - **Property 5: Всі RLS-політики використовують кешований auth.uid()**
    - **Validates: Вимоги 5.1**

  - [x] 3.3 Створити міграцію для видалення дублікатів індексів
    - `DROP INDEX IF EXISTS chat_participants_user_chat_idx` (дублікат `idx_chat_participants_user_chat`)
    - `DROP INDEX IF EXISTS idx_messages_badge_counts` (дублікат `messages_unread_by_chat_idx`)
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 6.1, 6.2, 6.3_

  - [x] 3.4 Створити міграцію для додавання індексу `idx_messages_sender_id`
    - `CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 7.1, 7.2_

  - [x] 3.5 Створити міграцію для посилення RLS-політик INSERT
    - Видалити `"System can insert participants"` з `WITH CHECK (true)` на `chat_participants`
    - Видалити `"System can create chats"` з `WITH CHECK (true)` на `chats`
    - Створити обмежені політики: `chat_participants` → `WITH CHECK (user_id = (select auth.uid()))`, `chats` → `WITH CHECK (type = 'direct')`
    - Перевірити працездатність тригерів `create_group_chat_on_walk_insert` та `add_participant_on_request_accept` (SECURITY DEFINER)
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 8.1, 8.2, 8.3_

  - [ ]* 3.6 Написати property-тест для INSERT-політик
    - **Property 6: INSERT-політики не використовують WITH CHECK (true)**
    - **Validates: Вимоги 8.1, 8.2**

  - [x] 3.7 Створити міграцію для виправлення search_path та переміщення розширень
    - Додати `SET search_path TO 'public'` до функції `reset_walk_request_on_leave_chat`
    - Перемістити розширення `cube` та `earthdistance` зі схеми `public` до `extensions`
    - Оновити `search_path` функцій, що використовують `ll_to_earth` / `earth_distance`, на `SET search_path TO 'public', 'extensions'`
    - Застосувати міграцію, регенерувати типи
    - _Вимоги: 9.1, 9.2, 9.3_

- [x] 4. Checkpoint — Перевірка Фази 2
  - Ensure all tests pass, ask the user if questions arise.
  - Перевірити безпеку через `mcp_supabase_get_advisors` (security + performance)
  - Перевірити, що тригери працюють після зміни RLS-політик

- [ ] 5. Фаза 3: Рефакторинг api.ts
  - [x] 5.1 Видалити мертвий код з api.ts
    - Видалити інтерфейс `ChatWithLastMessage`
    - Видалити функцію `getChatMessagesLegacy`
    - Видалити закоментовану функцію `getMyChatsLegacy`
    - Видалити функції `sendTextMessage` та `sendAudioMessage`
    - Видалити ручне каскадне видалення в `deleteChat` (залишити лише `supabase.from('chats').delete()`)
    - _Вимоги: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.2 Розділити api.ts на доменні модулі
    - Створити директорію `src/shared/lib/api/`
    - Створити модулі: `profiles.ts`, `walks.ts`, `walk-requests.ts`, `chats.ts`, `messages.ts`, `storage.ts`, `badges.ts`
    - Перенести відповідні функції, інтерфейси та типи в кожен модуль
    - Замінити вміст `api.ts` на реекспорт: `export * from './api/profiles'` тощо
    - Перевірити, що всі існуючі імпорти `from '@shared/lib/api'` працюють без змін
    - _Вимоги: 10.1, 10.2, 10.3_

  - [ ]* 5.3 Написати тест для перевірки реекспорту модулів
    - **Property 7: Реекспорт зберігає повний набір експортів**
    - **Validates: Вимоги 10.2, 10.3**

  - [x] 5.4 Усунити дублювання та виправити типи
    - Об'єднати `uploadEventImage` та `uploadAvatar` у спільну `uploadImage(bucket, userId, imageUri)` в `storage.ts`
    - Замінити `any` у `getMyChats` на згенерований тип з `Database_Types`
    - Замінити `any` у `getChatDetails` на згенерований тип з `Database_Types`
    - Видалити зайвий запит `created_at` у `getChatDetails` — включити поле в RPC `get_chat_details`
    - Типізувати Supabase-клієнт з генериком `Database` у `supabase.ts`
    - _Вимоги: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 5.5 Написати тест для перевірки відсутності типу `any` в RPC-функціях
    - **Property 8: API-функції з RPC не використовують тип any**
    - **Validates: Вимоги 12.2, 12.3**

- [x] 6. Checkpoint — Перевірка Фази 3
  - Ensure all tests pass, ask the user if questions arise.
  - Перевірити, що TypeScript компілюється без помилок
  - Перевірити, що всі імпорти з `@shared/lib/api` працюють

- [ ] 7. Оновити агента `supabase-expert`
  - [x] 7.1 Додати нові правила до `.kiro/agents/supabase-expert.md`
    - Правило: складні читання (JOIN, агрегації) → RPC-функції
    - Правило: пагінація великих списків → курсорна (keyset), не offset
    - Правило: RLS-політики → `(select auth.uid())` замість `auth.uid()`
    - Правило: INSERT/UPDATE/DELETE RLS → не `WITH CHECK (true)`, системні операції через SECURITY DEFINER тригери
    - Правило: нові API-функції → згенеровані типи з Database_Types, не `any`
    - Правило: api.ts розділений на модулі, нові функції → у відповідний модуль
    - Правило: перед створенням індексу → перевірити дублікати через `mcp_supabase_get_advisors`
    - Оновити схему БД з новими RPC-функціями, індексами та RLS-політиками
    - _Вимоги: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 8. Фінальний checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Перевірити покриття всіх 13 вимог
  - Запустити `mcp_supabase_get_advisors` для фінальної перевірки безпеки та продуктивності

## Примітки

- Завдання з `*` є опціональними і можуть бути пропущені для швидшого MVP
- Кожне завдання посилається на конкретні вимоги для трасування
- Checkpoints забезпечують інкрементальну валідацію
- Property-тести валідують універсальні властивості коректності
- Всі міграції делегуються агенту `supabase-expert`
- Після кожної міграції обов'язкова регенерація типів
