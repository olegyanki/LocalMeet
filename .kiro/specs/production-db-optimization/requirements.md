# Документ вимог: Production Database Optimization

## Вступ

Комплексна оптимізація Supabase-шару бази даних для мобільного додатку LocalMeet (React Native). Основна мета — підготовка до продакшену: міграція прямих запитів до таблиць на RPC-функції для зворотної сумісності з різними версіями мобільного додатку, виправлення проблем продуктивності RLS, очищення дублікатів індексів, посилення безпеки та рефакторинг api.ts.

Ключове обмеження: мобільний додаток — кілька версій одночасно в продакшені. RPC-функції створюють стабільний API-контракт, який можна оновлювати на сервері без необхідності оновлення додатку.

## Глосарій

- **API_Layer** — модуль `src/shared/lib/api.ts`, єдина точка взаємодії клієнта з базою даних через Supabase SDK
- **RPC_Function** — серверна PostgreSQL-функція, що викликається через `supabase.rpc()` і абстрагує структуру таблиць від клієнта
- **RLS_Policy** — Row Level Security політика PostgreSQL, що контролює доступ до рядків таблиці на рівні бази даних
- **Cursor_Pagination** — метод пагінації на основі ключа (keyset), що використовує значення останнього елемента замість offset
- **N_Plus_1_Pattern** — антипатерн, коли для N елементів виконується 1 + N (або більше) окремих запитів замість одного об'єднаного
- **Supabase_Client** — TypeScript-клієнт Supabase, ініціалізований у `src/shared/lib/supabase.ts`
- **Database_Types** — автоматично згенеровані TypeScript-типи зі схеми бази даних у `src/shared/lib/database.types.ts`
- **Search_Path** — параметр PostgreSQL-функції, що визначає схему пошуку об'єктів (таблиць, функцій)

## Вимоги

### Вимога 1: Міграція getWalksByUserId на RPC-функцію

**User Story:** Як розробник, я хочу замінити прямий запит до таблиці walks на RPC-функцію, щоб зміни схеми таблиці walks не ламали старі версії додатку.

#### Критерії приймання

1. THE RPC_Function `get_walks_by_user_id` SHALL приймати параметр `p_user_id UUID` та повертати список прогулянок користувача з полями id, user_id, title, start_time, duration, description, latitude, longitude, image_url, type
2. WHEN параметр `p_user_id` передано, THE RPC_Function SHALL повертати лише прогулянки з `deleted = false`, відсортовані за `start_time` за зростанням
3. THE API_Layer SHALL викликати `supabase.rpc('get_walks_by_user_id')` замість прямого запиту `supabase.from('walks').select('*')`
4. THE RPC_Function SHALL мати `SET search_path TO 'public'` та використовувати аліаси таблиць для всіх посилань на колонки

### Вимога 2: Міграція запитів walk_requests на RPC-функції

**User Story:** Як розробник, я хочу замінити три дубльовані функції (getMyWalkRequests, getPendingWalkRequests, getPastWalkRequests) на дві RPC-функції, щоб усунути N+1 патерн та дублювання коду.

#### Критерії приймання

1. THE RPC_Function `get_walk_requests_for_owner` SHALL приймати параметри `p_user_id UUID` та `p_status TEXT` і повертати запити на прогулянки з профілями заявників та даними прогулянок в одному запиті
2. WHEN `p_status` дорівнює `'pending'`, THE RPC_Function SHALL повертати лише запити зі статусом pending, відсортовані за `created_at` за спаданням
3. WHEN `p_status` дорівнює `'past'`, THE RPC_Function SHALL повертати запити зі статусами accepted та rejected, відсортовані за `updated_at` за спаданням
4. THE API_Layer SHALL замінити функції `getMyWalkRequests` та `getPendingWalkRequests` однією функцією, що викликає `get_walk_requests_for_owner` з `p_status = 'pending'`
5. THE API_Layer SHALL замінити функцію `getPastWalkRequests` викликом `get_walk_requests_for_owner` з `p_status = 'past'`
6. THE RPC_Function SHALL усувати N+1 патерн, виконуючи JOIN між walk_requests, profiles та walks в одному запиті замість трьох окремих

### Вимога 3: Міграція getWalkParticipants на RPC-функцію

**User Story:** Як розробник, я хочу замінити прямий запит з вкладеним select на RPC-функцію, щоб абстрагувати структуру зв'язку walk_requests → profiles від клієнта.

#### Критерії приймання

1. THE RPC_Function `get_walk_participants` SHALL приймати параметр `p_walk_id UUID` та повертати профілі учасників прогулянки (id, first_name, last_name, bio, avatar_url, gender, languages, interests, social_instagram, social_telegram, occupation)
2. THE RPC_Function SHALL повертати лише учасників із запитами зі статусом `'accepted'`
3. THE API_Layer SHALL викликати `supabase.rpc('get_walk_participants')` замість прямого запиту з вкладеним select до walk_requests та profiles

### Вимога 4: Курсорна пагінація для getChatMessages

**User Story:** Як розробник, я хочу замінити offset-пагінацію повідомлень чату на курсорну пагінацію, щоб забезпечити стабільну продуктивність на великих таблицях повідомлень.

#### Критерії приймання

1. THE RPC_Function `get_chat_messages_cursor` SHALL приймати параметри `p_chat_id UUID`, `p_limit INTEGER` та `p_cursor TIMESTAMPTZ` (nullable) і повертати повідомлення з профілями відправників
2. WHEN `p_cursor` дорівнює NULL, THE RPC_Function SHALL повертати останні `p_limit` повідомлень, відсортованих за `created_at` за спаданням
3. WHEN `p_cursor` передано, THE RPC_Function SHALL повертати `p_limit` повідомлень, створених раніше за `p_cursor`, відсортованих за `created_at` за спаданням
4. THE API_Layer SHALL замінити offset-параметр у `getChatMessages` на cursor-параметр типу `string | undefined`
5. THE RPC_Function SHALL повертати поле `has_more BOOLEAN`, що вказує, чи є ще повідомлення для завантаження


### Вимога 5: Виправлення продуктивності RLS-політик

**User Story:** Як розробник, я хочу виправити RLS-політики, що використовують `auth.uid()` без обгортки `(select auth.uid())`, щоб уникнути повторного обчислення на кожному рядку та покращити продуктивність запитів.

#### Критерії приймання

1. THE Database SHALL використовувати `(select auth.uid())` замість `auth.uid()` у всіх RLS-політиках на таблицях chats, messages та chat_participants
2. WHEN RLS-політика оцінюється для набору рядків, THE Database SHALL обчислювати `auth.uid()` один раз і кешувати результат замість повторного обчислення для кожного рядка
3. THE Database SHALL зберігати ідентичну логіку авторизації після заміни — жодна політика не повинна змінити свою семантику доступу

### Вимога 6: Очищення дублікатів індексів

**User Story:** Як розробник, я хочу видалити дубльовані індекси, щоб зменшити накладні витрати на запис та використання дискового простору.

#### Критерії приймання

1. THE Database SHALL видалити індекс `chat_participants_user_chat_idx`, оскільки він ідентичний `idx_chat_participants_user_chat`
2. THE Database SHALL видалити індекс `idx_messages_badge_counts`, оскільки він ідентичний `messages_unread_by_chat_idx`
3. THE Database SHALL зберегти по одному індексу з кожної пари дублікатів, щоб покриття запитів залишилось незмінним

### Вимога 7: Додавання відсутнього індексу для messages.sender_id

**User Story:** Як розробник, я хочу додати індекс на колонку `messages.sender_id`, щоб JOIN-запити по відправнику повідомлень виконувались ефективно.

#### Критерії приймання

1. THE Database SHALL мати індекс `idx_messages_sender_id` на колонці `messages.sender_id`
2. WHEN виконується JOIN між messages та profiles по sender_id, THE Database SHALL використовувати індекс замість послідовного сканування

### Вимога 8: Посилення безпеки RLS-політик

**User Story:** Як розробник, я хочу замінити надмірно дозвільні RLS-політики на обмежені, щоб запобігти несанкціонованому створенню чатів та додаванню учасників.

#### Критерії приймання

1. THE RLS_Policy "System can insert participants" на таблиці chat_participants SHALL дозволяти INSERT лише через SECURITY DEFINER тригер-функції, а не через `WITH CHECK (true)` для всіх автентифікованих користувачів
2. THE RLS_Policy "System can create chats" на таблиці chats SHALL дозволяти INSERT лише через SECURITY DEFINER тригер-функції, а не через `WITH CHECK (true)` для всіх автентифікованих користувачів
3. THE Database SHALL зберігати працездатність тригерів `create_group_chat_on_walk_insert` та `add_participant_on_request_accept` після зміни RLS-політик

### Вимога 9: Виправлення search_path та схеми розширень

**User Story:** Як розробник, я хочу виправити відсутній search_path у функції та перемістити розширення з public-схеми, щоб відповідати найкращим практикам безпеки Supabase.

#### Критерії приймання

1. THE Database SHALL додати `SET search_path TO 'public'` до функції `reset_walk_request_on_leave_chat`
2. THE Database SHALL перемістити розширення `cube` та `earthdistance` зі схеми public до схеми extensions
3. IF розширення переміщено до схеми extensions, THEN THE Database SHALL оновити всі функції, що використовують `ll_to_earth` та `earth_distance`, додавши відповідний search_path або кваліфікацію схеми

### Вимога 10: Рефакторинг api.ts — розділення на модулі

**User Story:** Як розробник, я хочу розділити файл api.ts (1371 рядок) на окремі модулі за доменами, щоб покращити підтримуваність та навігацію по коду.

#### Критерії приймання

1. THE API_Layer SHALL бути розділений на модулі: profiles, walks, walk-requests, chats, messages, storage, badges
2. THE API_Layer SHALL реекспортувати всі публічні функції та типи з головного файлу `api.ts` для зворотної сумісності імпортів
3. WHEN модуль імпортується через `@shared/lib/api`, THE API_Layer SHALL надавати ідентичний набір експортів, що й поточний монолітний файл

### Вимога 11: Видалення мертвого коду з api.ts

**User Story:** Як розробник, я хочу видалити невикористовуваний та застарілий код, щоб зменшити розмір файлу та уникнути плутанини.

#### Критерії приймання

1. THE API_Layer SHALL видалити інтерфейс `ChatWithLastMessage`, оскільки він замінений на `ChatWithDetails`
2. THE API_Layer SHALL видалити функцію `getChatMessagesLegacy`, оскільки вона замінена на `getChatMessages`
3. THE API_Layer SHALL видалити закоментовану функцію `getMyChatsLegacy`
4. THE API_Layer SHALL видалити функції `sendTextMessage` та `sendAudioMessage`, оскільки вони дубльовані універсальною функцією `sendMessage`
5. THE API_Layer SHALL видалити ручне каскадне видалення у функції `deleteChat`, оскільки база даних вже має ON DELETE CASCADE на messages

### Вимога 12: Усунення дублювання та виправлення типів в api.ts

**User Story:** Як розробник, я хочу усунути дублювання коду та замінити типи `any` на згенеровані типи, щоб покращити типобезпеку та зменшити обсяг коду.

#### Критерії приймання

1. THE API_Layer SHALL об'єднати функції `uploadEventImage` та `uploadAvatar` у спільну допоміжну функцію `uploadImage` з параметром bucket
2. THE API_Layer SHALL замінити тип `any` у функції `getMyChats` на згенерований тип з Database_Types
3. THE API_Layer SHALL замінити тип `any` у функції `getChatDetails` на згенерований тип з Database_Types
4. THE API_Layer SHALL видалити зайвий запит `created_at` у функції `getChatDetails`, включивши це поле в RPC-функцію `get_chat_details`
5. THE Supabase_Client SHALL бути типізований з генериком `Database` у файлі `src/shared/lib/supabase.ts`
### Вимога 13: Оновлення supabase-expert агента з реалізованими best practices

**User Story:** Як розробник, я хочу оновити агента `supabase-expert` після завершення оптимізації, щоб весь новий функціонал писався на основі реалізованих best practices і не повторював старі помилки.

#### Критерії приймання

1. THE Supabase_Expert_Agent SHALL містити правило: всі складні читання (JOIN, агрегації, multi-table) MUST використовувати RPC-функції, а не прямі запити до таблиць
2. THE Supabase_Expert_Agent SHALL містити правило: пагінація повідомлень та інших великих списків MUST використовувати курсорну пагінацію (keyset), а не offset
3. THE Supabase_Expert_Agent SHALL містити правило: всі RLS-політики MUST використовувати `(select auth.uid())` замість `auth.uid()` для уникнення per-row re-evaluation
4. THE Supabase_Expert_Agent SHALL містити правило: RLS-політики для INSERT/UPDATE/DELETE MUST NOT використовувати `WITH CHECK (true)` — системні операції мають виконуватись через SECURITY DEFINER тригери
5. THE Supabase_Expert_Agent SHALL містити правило: нові API-функції MUST використовувати згенеровані типи з Database_Types замість `any`
6. THE Supabase_Expert_Agent SHALL містити правило: файл api.ts MUST бути розділений на модулі за доменами, нові функції додаються у відповідний модуль
7. THE Supabase_Expert_Agent SHALL містити оновлену схему БД з усіма новими RPC-функціями, індексами та RLS-політиками, створеними в рамках цієї оптимізації
8. THE Supabase_Expert_Agent SHALL містити правило: перед створенням нового індексу MUST перевірити існуючі індекси на дублікати через `mcp_supabase_get_advisors`
