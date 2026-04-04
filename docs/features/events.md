# Події (Events)

> Користувачі створюють події (прогулянки), інші бачать їх на карті та можуть приєднатися.

## Два типи подій

### Regular Event (`type = 'event'`)
- Має назву, опис, час початку, тривалість
- Може мати обкладинку (image_url)
- Груповий чат створюється автоматично при створенні
- Відображається на карті як маркер

### Live Event (`type = 'live'`)
- Без назви (title = NULL)
- Створюється "на ходу" — юзер натискає "+" і починає прогулянку
- Тривалість за замовчуванням: 7200 секунд (2 години)
- Чат створюється лазі (не одразу)
- Детальніше: [Live-прогулянки](./live-events.md)

## Створення події

### Regular Event
```
CreateEventScreen
  → заповнення форми (title, description, time, duration, location, image)
  → createWalk() API
  → DB тригер створює group chat
  → подія з'являється на карті
```

### Live Event
```
LiveScreen (через PlusTabButton)
  → LiveBottomSheet (вибір статусу)
  → createLiveWalk() API
  → подія з'являється на карті
  → чат НЕ створюється (lazy)
```

## Walk Requests

Інші юзери бачать подію на карті → відкривають деталі → надсилають запит:

```
EventDetailsScreen
  → createWalkRequest(walkId, requesterId, message)
  → owner бачить запит у деталях події
  → owner приймає/відхиляє
  → при accept: тригер додає учасника в чат
```

Статуси: `pending` → `accepted` / `rejected`

При виході з чату: статус скидається на `pending` (тригер).

Статус запиту поточного користувача повертається з RPC `get_nearby_walks_filtered` через поле `my_request_status` (LEFT JOIN на `walk_requests`). Це дозволяє показувати стан запиту на картках подій без додаткових запитів.

## Ключові файли

| Файл | Опис |
|---|---|
| `src/shared/lib/api/walks.ts` | createWalk, createLiveWalk, getNearbyWalks, etc. |
| `src/shared/lib/api/walk-requests.ts` | createWalkRequest, updateWalkRequestStatus |
| `src/features/events/screens/CreateEventScreen.tsx` | Форма створення події |
| `src/features/event-details/` | Деталі події |
| `src/features/live/components/LiveScreen.tsx` | Live-прогулянка |
| `src/features/live/components/LiveBottomSheet.tsx` | Bottom sheet для live |

## Нюанси

- `duration` зберігається в **секундах** (не хвилинах)
- Soft delete: `deleted = true` замість фізичного видалення. Чати видалених подій автоматично приховуються з RPC `get_my_chats_optimized`
- Після видалення події: `router.dismissAll()` повертає на кореневий екран, badge counts синхронізуються
- Live events мають обмеження на одночасність (TIME_OVERLAP error)
- Nearby walks використовують `earth_distance` для геопошуку (PostgreSQL earthdistance extension)
