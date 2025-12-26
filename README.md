# LocalMeet

Мобільний застосунок для знайомств та організації спонтанних зустрічей на основі геолокації та спільних інтересів.

## 📱 Про проект

LocalMeet допомагає людям знаходити цікавих людей та івенти поблизу в реальному часі. Головний екран - це інтерактивна карта, де видно людей які зараз гуляють довкола, з можливістю переглянути їх профіль та відправити запит на зустріч.

### Ключові можливості

- **Карта в реальному часі**: Бачити людей які зараз гуляють поблизу (до 15 км)
- **Створення івентів**: Публікувати свої плани ("Іду гуляти в парку", "Граємо в волейбол на пляжі")
- **Майбутні події**: Планувати зустрічі наперед з вказанням часу та локації
- **Запити на зустріч**: Відправляти та приймати запити на приєднання до івентів
- **Чати**: Спілкуватись з людьми після прийняття запиту
- **Профілі**: Інтереси, мови, соціальні мережі, що шукаєш

### User Stories

1. **Спонтанна активність**: Сиджу дома в Валенсії, бачу що на пляжі грають у волейбол, відправляю запит приєднатись
2. **Організація події**: Створюю івент "Чайна церемонія в парку через 2 години", отримую запити, обираю з ким провести час
3. **Знайомства в подорожі**: Прилітаю в нове місто, шукаю людей з спільними інтересами поблизу для спілкування

## 🎯 Цільова аудиторія

- Номади, мандрівники, мігранти які шукають спілкування
- Люди які люблять нестандартно проводити час
- Шукачі унікальних ком'юніті (йога, медитації, психологія)
- Спонтанні люди які не люблять планувати заздалегідь
- Активні організатори івентів

## 🏗️ Технічний стек

### Frontend
- **React Native** (0.81.4) + **Expo** (54.0.10)
- **Expo Router** (6.0.8) - file-based routing
- **TypeScript** (5.9.2)
- **Lucide React Native** - іконки
- **i18n** - підтримка мов (українська, англійська)

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL база даних
  - Authentication
  - Real-time subscriptions
  - Storage для фото/аудіо

### Карти
- **Leaflet** (через WebView для всіх платформ)
- **Mapbox** - custom style для карт
- Власний компонент NativeMap

### Додаткові бібліотеки
- **expo-location** - геолокація
- **expo-image-picker** - вибір фото
- **expo-av** - аудіо повідомлення
- **@react-native-async-storage** - локальне зберігання

## 📁 Структура проекту

```
LocalMeet/
├── app/                          # Expo Router (тільки роутинг)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # Search screen (карта)
│   │   ├── create-event.tsx     # Створення івенту
│   │   ├── chats.tsx            # Список чатів
│   │   ├── profile.tsx          # Мій профіль
│   │   └── onboarding.tsx       # Онбординг
│   ├── auth/                     # Авторизація
│   ├── chat/[id].tsx            # Екран чату
│   └── user/[id].tsx            # Профіль користувача
│
├── src/
│   ├── features/                # Feature-based modules
│   │   ├── auth/                # Авторизація
│   │   │   └── screens/
│   │   │       ├── login.tsx
│   │   │       └── register.tsx
│   │   │
│   │   ├── search/              # Пошук людей на карті
│   │   │   ├── screens/
│   │   │   │   └── SearchScreen.tsx
│   │   │   ├── maps/
│   │   │   │   └── NativeMap.tsx    # Leaflet через WebView
│   │   │   └── components/
│   │   │       └── FilterBottomSheet.tsx  # Фільтри та сортування
│   │   │
│   │   ├── events/              # Створення та управління івентами
│   │   │   ├── screens/
│   │   │   │   └── CreateEventScreen.tsx
│   │   │   └── modals/
│   │   │       ├── EventDetailsBottomSheet.tsx
│   │   │       ├── ContactRequestBottomSheet.tsx
│   │   │       ├── LocationPickerModal.tsx
│   │   │       ├── TimePickerModal.tsx
│   │   │       └── SuccessModal.tsx
│   │   │
│   │   ├── chats/               # Чати та запити
│   │   │   ├── screens/
│   │   │   │   ├── ChatsListScreen.tsx
│   │   │   │   └── ChatScreen.tsx
│   │   │   └── components/
│   │   │       └── RequestCard.tsx
│   │   │
│   │   ├── profile/             # Профілі користувачів
│   │   │   └── screens/
│   │   │       ├── ProfileScreen.tsx
│   │   │       └── UserProfileScreen.tsx
│   │   │
│   │   └── onboarding/          # Перший запуск
│   │       └── screens/
│   │           └── OnboardingScreen.tsx
│   │
│   └── shared/                  # Спільні ресурси
│       ├── components/
│       │   ├── AudioPlayer.tsx
│       │   ├── AudioRecorder.tsx
│       │   ├── AvatarPicker.tsx
│       │   ├── InterestPicker.tsx
│       │   ├── Avatar.tsx           # Reusable avatar
│       │   └── LocationPin.tsx      # Custom SVG icon
│       ├── constants/
│       │   ├── colors.ts            # Centralized colors
│       │   ├── styles.ts            # Common styles & sizes
│       │   └── index.ts
│       ├── contexts/
│       │   ├── AuthContext.tsx
│       │   └── CreateEventContext.tsx
│       ├── hooks/
│       │   └── useFrameworkReady.ts
│       ├── i18n/                    # Internationalization
│       │   ├── locales/
│       │   │   ├── uk.json          # Ukrainian translations
│       │   │   └── en.json          # English translations
│       │   ├── I18nContext.tsx      # Language context
│       │   ├── translations.ts
│       │   └── index.ts
│       ├── lib/
│       │   ├── api.ts           # API функції
│       │   ├── auth.ts          # Авторизація
│       │   └── supabase.ts      # Supabase client
│       └── utils/
│           ├── location.ts
│           └── time.ts          # Time utilities
```

## 🗄️ База даних (Supabase)

### Основні таблиці

#### `profiles`
Профілі користувачів
- `id` (uuid, PK)
- `username` (text, unique)
- `display_name` (text)
- `bio` (text)
- `avatar_url` (text)
- `age` (int)
- `gender` (text)
- `languages` (text[])
- `interests` (text[])
- `social_instagram`, `social_telegram` (text)
- `looking_for` (text)

#### `walks`
Івенти/прогулянки
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `title` (text) - назва івенту
- `start_time` (timestamp) - коли починається
- `duration` (text) - тривалість ("2 год", "1 год 30 хв")
- `description` (text)
- `latitude`, `longitude` (float) - локація івенту
- `is_active` (boolean) - чи активний
- `deleted` (boolean) - м'яке видалення
- `created_at`, `updated_at` (timestamp)

#### `user_locations`
Поточна локація користувачів
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `latitude`, `longitude` (float)
- `updated_at` (timestamp)

#### `walk_requests`
Запити на приєднання до івентів
- `id` (uuid, PK)
- `walk_id` (uuid, FK → walks)
- `requester_id` (uuid, FK → profiles)
- `message` (text) - повідомлення від того хто просить
- `status` (enum: pending, accepted, rejected)
- `created_at`, `updated_at` (timestamp)

#### `chats`
Чати між користувачами
- `id` (uuid, PK)
- `requester_id` (uuid, FK → profiles)
- `walker_id` (uuid, FK → profiles) - власник івенту
- `walk_request_id` (uuid, FK → walk_requests)
- `created_at`, `updated_at` (timestamp)

#### `messages`
Повідомлення в чатах
- `id` (uuid, PK)
- `chat_id` (uuid, FK → chats)
- `sender_id` (uuid, FK → profiles)
- `content` (text)
- `image_url` (text) - фото
- `audio_url` (text) - голосове
- `audio_duration` (int) - тривалість аудіо
- `read` (boolean)
- `created_at` (timestamp)

### Storage Buckets
- `avatars` - аватарки користувачів
- `chat-images` - фото в чатах
- `chat-audio` - голосові повідомлення

## 🔑 Ключові функції API

### Walks (івенти)
```typescript
// Створити івент
createWalk(data: {
  userId, title, startTime, duration, 
  description, latitude, longitude
})

// Отримати активні івенти поблизу (до 15 км)
getNearbyWalks(latitude, longitude, radiusKm = 5)

// Завершити/видалити івент
endWalk(walkId)
deleteWalk(walkId)

// Перевірка перетину часу
updateWalkStatus(userId, data) // кидає TIME_OVERLAP якщо конфлікт
```

### Walk Requests (запити)
```typescript
// Відправити запит на приєднання
createWalkRequest({ walkId, requesterId, message })

// Прийняти/відхилити запит
updateWalkRequestStatus(requestId, 'accepted' | 'rejected')

// Отримати запити до моїх івентів
getMyWalkRequests(userId)

// Перевірити чи я вже відправив запит
getMyRequestForWalk(walkId, requesterId)
```

### Location
```typescript
// Оновити свою локацію
updateLocation(userId, latitude, longitude)
```

### Profile
```typescript
// Оновити профіль
updateProfile(userId, data)

// Отримати профіль
getProfile(userId)
```

## 🎨 UI/UX особливості

### Карта (Search Screen)
- Показує маркери користувачів з активними івентами
- Кольорове кодування маркерів:
  - 🟢 Зелений - івент вже почався
  - 🟠 Помаранчевий - починається скоро (≤15 хв)
  - 🔵 Блакитний - починається пізніше
- Пульсуюча анімація на маркерах
- Горизонтальний скрол карточок знизу
- Синхронізація: свайп карточки → центрування карти
- Кнопка "Моя локація" для повернення до своєї позиції

### Створення івенту (Create Event)
- Вибір часу початку (години/хвилини)
- Вибір тривалості (1-6 годин)
- Вибір локації на карті (до 15 км від поточної)
- Перевірка перетину часу з іншими івентами
- KeyboardAvoidingView для зручності вводу

### Чати
- Real-time оновлення через Supabase subscriptions
- Підтримка текстових, фото та аудіо повідомлень
- Індикатор прочитаних повідомлень
- Pull-to-refresh для оновлення списку
- Розділення на "Chats" та "Requests" табами

### Профіль
- Редагування інтересів (InterestPicker)
- Вибір аватарки (ImagePicker)
- Соціальні мережі (Instagram, Telegram)
- Мови спілкування
- "Що шукаєш" - опис

## 🔄 Real-time Features

### Supabase Subscriptions
```typescript
// Нові повідомлення в чаті
supabase
  .channel(`chat-${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`
  }, handleNewMessage)
```

## 🚀 Запуск проекту

### Встановлення
```bash
npm install
```

### Налаштування .env
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Запуск
```bash
npm run dev          # Запуск Expo dev server
npm run build:web    # Білд для web
npm run typecheck    # Перевірка типів
```

## 📱 Платформи

- ✅ iOS (React Native)
- ✅ Android (React Native)
- ✅ Web (React Native Web + Leaflet для карт)

## 🎯 Path Aliases

```typescript
import { useAuth } from '@shared/contexts';
import { supabase } from '@shared/lib';
import { COLORS, SIZES } from '@shared/constants';
import { useI18n } from '@shared/i18n';
import NativeMap from '@features/search/maps/NativeMap';
import EventDetailsBottomSheet from '@features/events/modals/EventDetailsBottomSheet';
```

## 🔐 Авторизація

- Email/Password через Supabase Auth
- Автоматичне створення профілю при реєстрації (trigger)
- AuthContext для глобального стану користувача
- Захищені роути через Expo Router

## 📊 Бізнес-логіка

### Активність івенту
Івент вважається активним якщо:
- `is_active = true`
- `deleted = false` або `null`
- Поточний час < `start_time + duration`

### Радіус пошуку
- За замовчуванням 5 км
- Максимум 15 км для вибору локації івенту
- Використовується формула Haversine для розрахунку відстані

### Перетин часу
При створенні івенту перевіряється чи не перетинається з іншими активними івентами користувача.

### Автоматичне завершення
При завантаженні списку івентів перевіряється чи не закінчився час, якщо так - івент автоматично деактивується.

## 🎨 Дизайн система

### Константи
Всі кольори, розміри та стилі централізовані в `src/shared/constants/`:

```typescript
// colors.ts
export const COLORS = {
  ACCENT_ORANGE: '#FF9500',
  TEXT_DARK: '#333333',
  TEXT_LIGHT: '#999999',
  BG_COLOR: '#F5F5F5',
  CARD_BG: '#FFFFFF',
  BORDER_COLOR: '#E8E8E8',
  SUCCESS_GREEN: '#4CAF50',
};

// styles.ts
export const SIZES = {
  AVATAR_SMALL: 32,
  AVATAR_MEDIUM: 48,
  AVATAR_LARGE: 80,
  TAB_BAR_HEIGHT: 78,
  CARDS_COLLAPSE_DISTANCE: 250,
};

export const COMMON_STYLES = {
  shadow: { /* shadow styles */ },
  avatar: { /* avatar styles */ },
};
```

### Reusable компоненти
- **Avatar** - аватар з placeholder
- **LocationPin** - custom SVG іконка локації

### Кольори
- `ACCENT_ORANGE` - #FF9500 (основний акцент)
- `TEXT_DARK` - #333333
- `TEXT_LIGHT` - #999999
- `SUCCESS_GREEN` - #4CAF50
- `BORDER_COLOR` - #E8E8E8

### Компоненти
- Bottom sheets для модальних вікон
- Карточки з тінями та rounded corners
- Smooth анімації (Animated API)
- Pull-to-refresh в списках

## 🌍 Internationalization (i18n)

### Структура
```
src/shared/i18n/
├── locales/
│   ├── uk.json          # Українські переклади
│   └── en.json          # Англійські переклади
├── I18nContext.tsx      # Context для управління мовою
├── translations.ts      # Імпорт JSON файлів
└── index.ts
```

### Використання
```typescript
import { useI18n } from '@shared/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();
  
  return (
    <Text>{t('myProfile')}</Text>
  );
}
```

### Додавання нових перекладів
1. Додати ключ в `uk.json` та `en.json`
2. Використовувати через `t('keyName')`
3. Мова зберігається в AsyncStorage
4. Перемикач мови в ProfileScreen

### Підтримувані мови
- 🇺🇦 Українська (за замовчуванням)
- 🇬🇧 English

## 🐛 Відомі особливості

- Карта не рухається автоматично при свайпі карточок (за дизайном)
- Клавіатура автоматично підіймає контент (KeyboardAvoidingView)
- Real-time оновлення тільки для чатів (не для карти)
- Всі платформи використовують Leaflet через WebView з Mapbox стилем

## 📝 TODO / Майбутні покращення

- [ ] Push notifications для нових запитів
- [ ] Фільтри на карті (за інтересами, віком)
- [ ] Історія зустрічей
- [ ] Рейтинг користувачів
- [ ] Блокування користувачів
- [ ] Скарги на контент
- [ ] Групові івенти (більше 2 людей)
- [ ] Повторювані івенти

## 👥 Для розробників

### Додавання нової фічі
1. Створити папку в `src/features/your-feature/`
2. Додати `screens/` та `components/`
3. Створити роут в `app/`
4. Додати re-export в app файл

### Робота з API
Всі API функції в `src/shared/lib/api.ts`
Використовуй TypeScript інтерфейси для типізації

### Стилі
- Використовуй константи з `@shared/constants`
- Використовуй StyleSheet.create()
- Responsive через Dimensions.get('window')

### Переклади
- Всі тексти через `t('key')` з useI18n()
- Додавай нові ключі в `uk.json` та `en.json`
- Ніколи не хардкодь тексти в компонентах

---

**Версія**: 1.0.0  
**Останнє оновлення**: Грудень 2024
