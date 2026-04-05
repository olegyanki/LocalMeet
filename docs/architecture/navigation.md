# Навігація

> File-based routing через Expo Router. Таби для основних екранів, стеки для вкладених.

## Структура

```
app/
├── _layout.tsx              # Root Stack Navigator
├── (tabs)/                  # Tab Navigator (з tab bar)
│   ├── _layout.tsx          # Конфігурація табів
│   ├── (search)/            # Таб "Пошук" (nested stack)
│   │   ├── _layout.tsx      # Stack navigator
│   │   ├── index.tsx        # Карта + список подій
│   │   └── event/[id].tsx   # Деталі події (tab bar видно)
│   ├── (profile)/           # Таб "Профіль" (nested stack)
│   │   ├── _layout.tsx      # Stack navigator
│   │   ├── index.tsx        # Профіль користувача
│   │   └── event/[id].tsx   # Деталі події (tab bar видно)
│   ├── create-event.tsx     # Створення події
│   ├── chats.tsx            # Список чатів
│   ├── settings.tsx         # Налаштування
├── chat/                    # Екран чату (без tab bar)
│   └── [id].tsx
├── user/                    # Профіль іншого юзера (без tab bar)
│   └── [id].tsx
├── event-details/           # Деталі події (без tab bar)
│   └── [id].tsx
└── auth/                    # Авторизація (без tab bar)
    ├── login.tsx
    └── register.tsx
```

## Правила

### Tab bar видимість
- Екрани всередині `(tabs)/` — tab bar видно
- Екрани поза `(tabs)/` (chat, user, auth) — tab bar приховано

### Route groups
- Папки в дужках `(folder)` не додають сегмент до URL
- `(search)` і `(profile)` — route groups з nested stacks
- Event details існує в обох стеках, щоб tab bar залишався видимим

### Навігація між екранами

```tsx
import { router } from 'expo-router';

// До деталей події (tab bar видно)
router.push(`/(tabs)/(search)/event/${eventId}`);

// До чату (tab bar приховано)
router.push(`/chat/${chatId}`);

// До профілю іншого юзера (tab bar приховано)
router.push(`/user/${userId}`);

// Назад
router.back();

// Заміна (без можливості повернутися)
router.replace('/auth/register');
```

## Нюанси

- Event details дублюється в `(search)` і `(profile)` стеках — це навмисно, щоб tab bar не зникав при переході з різних табів
- Чат-екран винесений за `(tabs)`, бо при відкритті чату tab bar має зникати для максимального простору
