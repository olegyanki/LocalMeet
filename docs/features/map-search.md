# Карта та пошук

> Головний екран додатку. Карта з подіями поруч, фільтри, маркери.

## Як працює

### Карта
- Leaflet через WebView (не нативна карта)
- Mapbox стиль тайлів (`mapbox-style.json`)
- Показує події в радіусі 15 км від юзера
- Маркери з інформацією про подію та автора

### Пошук подій
```
SearchScreen (index.tsx в (search) табі)
  → отримує геолокацію юзера
  → getNearbyWalksFiltered() — RPC з фільтрами
  → рендерить маркери на карті
  → список подій під картою
```

### Фільтри
- **Інтереси**: фільтр по інтересах автора події
- **Час**: now / today / tomorrow / this_week / all
- **Відстань**: максимальна відстань в км

Фільтри передаються в RPC `get_nearby_walks_filtered` і обробляються на стороні БД (не клієнта).

## Геопошук

Використовується PostgreSQL extension `earthdistance` + `cube`:

```sql
earth_distance(
  ll_to_earth(p_latitude, p_longitude),
  ll_to_earth(w.latitude, w.longitude)
) / 1000.0 AS distance
```

Індекс: GiST на `ll_to_earth(latitude, longitude)` для швидкого пошуку.

## Ключові файли

| Файл | Опис |
|---|---|
| `src/features/search/` | Фіча пошуку |
| `src/shared/lib/api/walks.ts` → `getNearbyWalksFiltered()` | API з фільтрами |
| `mapbox-style.json` | Стиль карти |

## Нюанси

- Карта працює через WebView — це обмежує інтерактивність, але дає кросплатформенність
- Радіус пошуку за замовчуванням: 15 км
- `distance` повертається в метрах з RPC
- Live events також відображаються на карті (з іншим маркером)
