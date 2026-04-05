# Live-прогулянки

> Спонтанні прогулянки "тут і зараз". Юзер натискає "+" і починає прогулянку без планування.

## Контекст

Regular events потребують планування: назва, час, опис. Live events — це "я зараз гуляю, хто хоче приєднатися?".

## Як працює

### Створення
1. Юзер натискає `PlusTabButton` (центральна кнопка "+" в tab bar)
2. Відкривається `LiveBottomSheet` з полем для статусу
3. `createLiveWalk()` створює walk з `type = 'live'`
4. Подія з'являється на карті

### Чат (Lazy Creation)
На відміну від regular events, чат НЕ створюється одразу. Це зроблено тому, що більшість live-прогулянок можуть не отримати жодного запиту.

Чат створюється в двох випадках:
1. **Тригер**: коли перший walk request приймається (`add_participant_on_request_accept`)
2. **Вручну**: коли owner відкриває чат через `getOrCreateChatForWalk(walkId, userId)`

### Відображення на карті
- `LiveEventCard` показує аватарку хоста, бейдж "Зараз активний", опис
- Кнопка "Написати" відкриває модалку запиту на приєднання
- Якщо запит вже надіслано (`my_request_status` з RPC) — показується лейбл "Запит надіслано" замість кнопки
- `SearchScreen` передає `requestStatus` в `LiveEventCard` з даних `getNearbyWalksFiltered`

### Відображення в списку чатів
- Порожні чати завершених live-подій **приховуються** (фільтр в RPC `get_my_chats_optimized`)
- Назва чату:
  - Для не-owner: `"Прогулянка [ім'я автора]"` / `"[name]'s walk"`
  - Для owner: `"Твоя прогулянка · [дата]"` / `"Your walk · [date]"`
- Аватарка чату: аватарка автора (не зображення події, бо live events не мають зображень)

## Ключові файли

| Файл | Опис |
|---|---|
| `src/shared/lib/api/walks.ts` → `createLiveWalk()` | Створення live walk |
| `src/shared/lib/api/chats.ts` → `getOrCreateChatForWalk()` | Lazy chat creation |
| `src/shared/components/LiveEventCard.tsx` | Картка live-події на карті (з `requestStatus`) |
| `src/features/live/components/LiveScreen.tsx` | UI live-прогулянки |
| `src/features/live/components/LiveBottomSheet.tsx` | Bottom sheet зі статусом |
| `src/features/live/components/PlusTabButton.tsx` | Кнопка "+" в tab bar |
| `supabase/migrations/*_skip_chat_creation_for_live_walks.sql` | Тригер не створює чат для live |
| `supabase/migrations/*_modify_add_participant_trigger_lazy_chat.sql` | Lazy chat creation в тригері |

## Нюанси

- `title = NULL` для live events — це нормально
- Тривалість за замовчуванням: 7200 секунд (2 години)
- TIME_OVERLAP: не можна мати дві live-прогулянки одночасно
- `walk_type` може бути `undefined` в старих даних — завжди використовуй fallback на `'event'`
- Рішення про lazy creation задокументовано в [ADR-001](../decisions/001-lazy-chat-creation.md)
