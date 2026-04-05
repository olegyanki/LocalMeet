# LocalMeet — Документація

> Документація проєкту LocalMeet. Тут зібрано все, що потрібно знати про архітектуру, фічі та прийняті рішення.

## Зміст

### 📐 Архітектура
- [Огляд проєкту](./architecture/overview.md) — tech stack, структура папок, загальна архітектура
- [Навігація](./architecture/navigation.md) — Expo Router, таби, навігаційні патерни
- [База даних](./architecture/database.md) — схема БД, таблиці, тригери, RPC функції

### 🧩 Фічі
- [Система чатів](./features/chat-system.md) — group, direct, live чати
- [Події (Events)](./features/events.md) — створення, відображення, типи подій
- [Live-прогулянки](./features/live-events.md) — live events, lazy chat creation
- [Карта та пошук](./features/map-search.md) — карта, фільтри, nearby walks
- [Авторизація та онбордінг](./features/auth-onboarding.md) — auth flow, onboarding

### 📖 Гайди
- [Як додати нову фічу](./guides/adding-new-feature.md) — покроковий гайд
- [Як додати новий екран](./guides/adding-new-screen.md) — створення екрану від А до Я
- [Database Workflow](./guides/database-workflow.md) — міграції, типи, best practices
- [Database Testing](./guides/database-testing.md) — exploration/preservation тести
- [Плюралізація](./guides/pluralization-guide.md) — i18n, множина для UK/EN
- [Дебагінг](./guides/debugging.md) — типові проблеми та їх вирішення

### 🧠 Рішення (ADR)
- [ADR-001: Lazy Chat Creation для Live Events](./decisions/001-lazy-chat-creation.md)
- [ADR-002: Real-time Badge Subscriptions](./decisions/002-badge-realtime-subscriptions.md)
- [ADR-003: Оптимізований RPC замість N+1 запитів](./decisions/003-optimized-rpc-queries.md)

---

## Як вести документацію

1. **Пиши коли робиш** — не відкладай на потім
2. **Документуй "чому"** — код показує "що", документація пояснює "чому"
3. **Тримай індекс актуальним** — додав файл → оновив цей README
4. **ADR для кожного нетривіального рішення** — через місяць забудеш чому
5. **Українською** — це наш проєкт

### Шаблон для нової фічі
```markdown
# Назва фічі

> Короткий опис одним реченням

## Контекст
Навіщо це існує, яку проблему вирішує.

## Як працює
Основна логіка, потік даних.

## Ключові файли
- `path/to/file.ts` — опис

## Нюанси
Речі, які легко забути або зламати.
```

### Шаблон для ADR
```markdown
# ADR-XXX: Назва рішення

## Статус: Прийнято / Відхилено / Замінено

## Контекст
Яка проблема стояла.

## Рішення
Що вирішили і чому.

## Альтернативи
Що ще розглядали.

## Наслідки
Що це змінило.
```
