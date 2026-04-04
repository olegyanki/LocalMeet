# План імплементації: Покращення чатів лайв-івентів

## Огляд

Інкрементальна імплементація чотирьох покращень системи чатів для лайв-івентів: ліниве створення чатів, приховування порожніх чатів, покращення назв/аватарів, зміна заголовка екрану деталей. Усі зміни стосуються виключно `type = 'live'`. Звичайні івенти залишаються без змін.

## Задачі

- [x] 1. Модифікація тригерів бази даних для лінивого створення чатів
  - [x] 1.1 Модифікувати тригер `create_group_chat_on_walk_insert()` — додати перевірку `NEW.type = 'live'` для пропуску створення чату
    - Створити SQL-міграцію з `CREATE OR REPLACE FUNCTION`
    - Якщо `NEW.type = 'live'` — повернути `NEW` без створення чату
    - Для `type = 'event'` — залишити існуючу логіку без змін
    - _Вимоги: 1.1, 1.2_

  - [x] 1.2 Модифікувати тригер `add_participant_on_request_accept()` — додати створення чату якщо він не існує для лайв-івентів
    - Створити SQL-міграцію з `CREATE OR REPLACE FUNCTION`
    - Якщо `target_chat_id IS NULL` — створити чат, додати owner (з `walks.user_id`), додати member (з `NEW.requester_id`)
    - Використати `ON CONFLICT (chat_id, user_id) DO NOTHING` для безпеки
    - _Вимоги: 1.3, 1.4_

  - [ ]* 1.3 Написати property-тест для тригера створення чату при вставці лайв-івенту
    - **Property 1: Лайв-івенти не створюють чат при вставці**
    - **Validates: Requirements 1.1**

  - [ ]* 1.4 Написати property-тест для тригера створення чату при вставці звичайного івенту
    - **Property 2: Звичайні івенти створюють чат при вставці**
    - **Validates: Requirements 1.2**

  - [ ]* 1.5 Написати property-тест для прийняття запиту лайв-івенту без чату
    - **Property 3: Прийняття запиту для лайв-івенту без чату створює чат з owner та member**
    - **Validates: Requirements 1.3**

  - [ ]* 1.6 Написати property-тест для прийняття запиту з існуючим чатом
    - **Property 4: Прийняття запиту для івенту з існуючим чатом додає member**
    - **Validates: Requirements 1.4**

- [x] 2. Оновлення RPC-функцій бази даних
  - [x] 2.1 Оновити `get_my_chats_optimized` — додати поля `creator_avatar_url`, `creator_first_name`, `walk_type` та фільтр порожніх завершених лайв-чатів
    - Створити SQL-міграцію з `CREATE OR REPLACE FUNCTION`
    - Додати JOIN з `profiles` по `walks.user_id` для отримання `creator_avatar_url` та `creator_first_name`
    - Додати `w.type AS walk_type` до результату
    - Додати WHERE-фільтр: виключити чати де `w.type = 'live'` AND завершився AND `participant_count = 1` AND `message_count = 0`
    - _Вимоги: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1_

  - [x] 2.2 Оновити `get_chat_details` — додати поля `creator_avatar_url`, `creator_first_name`, `walk_type`
    - Створити SQL-міграцію з `CREATE OR REPLACE FUNCTION`
    - Додати JOIN з `profiles` по `walks.user_id`
    - _Вимоги: 3.2_

  - [ ]* 2.3 Написати property-тест для фільтрації порожніх завершених лайв-чатів
    - **Property 6: Фільтрація порожніх завершених лайв-чатів**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.4 Написати property-тест для звичайних івентів у списку чатів
    - **Property 7: Звичайні івенти завжди в списку чатів**
    - **Validates: Requirements 2.4**

  - [ ]* 2.5 Написати property-тест для збереження прихованих чатів у БД
    - **Property 8: Приховані чати зберігаються в БД**
    - **Validates: Requirements 2.5**

  - [ ]* 2.6 Написати property-тест для полів creator у RPC
    - **Property 9: RPC повертає поля creator для групових чатів**
    - **Validates: Requirements 3.1, 3.2**

- [x] 3. Checkpoint — перевірка міграцій
  - Переконатися що всі міграції застосовані успішно, всі тести проходять. Запитати користувача якщо є питання.

- [x] 4. Регенерація типів та оновлення API-шару
  - [x] 4.1 Регенерувати `database.types.ts` після міграцій
    - Виконати `npx supabase gen types typescript --local > src/shared/lib/database.types.ts`
    - Перевірити що нові поля `creator_avatar_url`, `creator_first_name`, `walk_type` з'явились у типах
    - _Вимоги: 3.1, 3.2_

  - [x] 4.2 Додати нову функцію `getOrCreateChatForWalk` в `src/shared/lib/api/chats.ts`
    - Спробувати знайти існуючий чат через `getChatByWalkId`
    - Якщо не існує — створити чат + додати owner
    - Повернути `chat_id`
    - _Вимоги: 1.5, 1.6_

  - [x] 4.3 Оновити інтерфейс `ChatWithDetails` — додати поля `creator_avatar_url`, `creator_first_name`, `walk_type`
    - Додати опціональні поля в інтерфейс
    - _Вимоги: 3.1, 3.2_

  - [x] 4.4 Оновити маппінг в `getMyChats` та `getChatDetails` — додати нові поля з RPC-результату
    - Маппити `creator_avatar_url`, `creator_first_name`, `walk_type` з RPC-рядків
    - _Вимоги: 3.1, 3.2_

  - [ ]* 4.5 Написати property-тест для ідемпотентності `getOrCreateChatForWalk`
    - **Property 5: getOrCreateChatForWalk — ідемпотентність**
    - **Validates: Requirements 1.5**

- [x] 5. Додати ключі локалізації
  - [x] 5.1 Додати нові ключі в `en.json` та `uk.json`
    - `walkTitle`: EN `"Walk"` / UK `"Прогулянка"`
    - `walkOfName`: EN `"{{name}}'s walk"` / UK `"Прогулянка {{name}}"`
    - `yourWalk`: EN `"Your walk"` / UK `"Твоя прогулянка"`
    - _Вимоги: 3.13, 4.3_

- [x] 6. Оновлення UI-компонентів
  - [x] 6.1 Оновити `ChatsListScreen.tsx` — логіка назви та аватара для лайв-івентів
    - В `renderChatItem`: перевірити `item.walk_type === 'live'`
    - Якщо лайв + не власник → `displayName = t('walkOfName', { name: item.creator_first_name })`
    - Якщо лайв + власник → `displayName = t('yourWalk') + ' · ' + formatDateLabel(item.walk_start_time)` (Сьогодні/Вчора/дата)
    - Аватар: `item.creator_avatar_url` замість `item.walk_image_url`
    - Для звичайних івентів — без змін
    - _Вимоги: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.2 Оновити `ChatHeader.tsx` — логіка назви та аватара для лайв-івентів
    - Перевірити `chat.walk_type === 'live'`
    - Якщо лайв + не власник → назва `t('walkOfName', { name: chat.creator_first_name })`
    - Якщо лайв + власник → назва `t('yourWalk')`
    - Аватар: компонент `Avatar` з `chat.creator_avatar_url` замість `CachedImage` з `walk_image_url`
    - Для звичайних івентів — без змін
    - _Вимоги: 3.9, 3.10, 3.11, 3.12_

  - [x] 6.3 Оновити `EventDetailsScreen.tsx` — заголовок навігаційної панелі для лайв-івентів
    - Заголовок: `walk?.type === 'live' ? t('walkTitle') : (walk?.title || '')`
    - Стан помилки: також показувати `t('walkTitle')` для лайв-івентів
    - _Вимоги: 4.1, 4.2, 4.4_

  - [x] 6.4 Оновити `EventDetailsScreen.tsx` — кнопка "Чат" для лайв-івентів
    - В `handleOpenGroupChat`: якщо `walk.type === 'live'` → використати `getOrCreateChatForWalk(walk.id, currentUser.id)`
    - Якщо `walk.type === 'event'` → залишити `getChatByWalkId` як раніше
    - Обробка помилок: показати `t('errorOpeningChat')`
    - _Вимоги: 1.5, 1.6_

  - [ ]* 6.5 Написати property-тест для форматування назви чату лайв-івенту
    - **Property 10: Форматування назви чату лайв-івенту**
    - **Validates: Requirements 3.3, 3.9, 3.10**

  - [ ]* 6.6 Написати property-тест для аватара чату лайв-івенту
    - **Property 11: Аватар чату лайв-івенту — аватар власника**
    - **Validates: Requirements 3.7, 3.11**

  - [ ]* 6.7 Написати property-тест для відображення звичайних івентів без змін
    - **Property 12: Звичайні івенти — відображення без змін**
    - **Validates: Requirements 3.8, 3.12**

  - [ ]* 6.8 Написати property-тести для заголовка екрану деталей
    - **Property 13: Заголовок екрану деталей лайв-івенту**
    - **Property 14: Заголовок екрану деталей звичайного івенту — без змін**
    - **Validates: Requirements 4.1, 4.2**

- [x] 7. Оновлення документації
  - [x] 7.1 Оновити `project-context.md` — описати нове флоу чатів для лайв-івентів
    - Додати розділ про різницю між лайв-івентами та звичайними івентами в контексті чатів
    - Описати ліниве створення чатів (чат створюється при першому accepted запиті, а не при створенні івенту)
    - Описати приховування порожніх чатів завершених лайв-івентів (фільтрація в RPC, не видалення)
    - Описати нову функцію `getOrCreateChatForWalk` та коли її використовувати
    - Оновити секцію Group Chat System з урахуванням нового флоу
    - Додати нові i18n ключі (`walkTitle`, `walkOfName`, `yourWalk`)

  - [x] 7.2 Оновити `coding-practices.md` — додати правила для лайв-івент чатів
    - Описати що всі зміни чатів для лайв-івентів мають перевіряти `walk_type === 'live'`
    - Описати fallback поведінку: якщо `walk_type` не визначено — трактувати як `'event'`

- [x] 8. Фінальний checkpoint
  - Переконатися що всі тести проходять, всі вимоги покриті, документація оновлена. Запитати користувача якщо є питання.

## Примітки

- Задачі позначені `*` є опціональними і можуть бути пропущені для швидшого MVP
- Кожна задача посилається на конкретні вимоги для трасування
- Checkpoints забезпечують інкрементальну валідацію
- Property-тести валідують універсальні властивості коректності
- Задачі 1.x та 2.x (database) делегуються агенту `supabase-expert` згідно з правилами проєкту
- Задача 4.1 (регенерація типів) також делегується `supabase-expert`
