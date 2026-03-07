# Нова структура проекту LocalMeet

## Структура папок

```
LocalMeet/
├── app/                          # Expo Router (тільки роутинг)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx            # → src/features/search/screens/SearchScreen.tsx
│   │   ├── create-event.tsx     # → src/features/events/screens/CreateEventScreen.tsx
│   │   ├── chats.tsx            # → src/features/chats/screens/ChatsListScreen.tsx
│   │   ├── profile.tsx          # → src/features/profile/screens/ProfileScreen.tsx
│   │   └── onboarding.tsx       # → src/features/onboarding/screens/OnboardingScreen.tsx
│   ├── auth/
│   │   ├── login.tsx            # → src/features/auth/screens/login.tsx
│   │   └── register.tsx         # → src/features/auth/screens/register.tsx
│   ├── chat/
│   │   └── [id].tsx             # → src/features/chats/screens/ChatScreen.tsx
│   └── user/
│       └── [id].tsx             # → src/features/profile/screens/UserProfileScreen.tsx
│
├── src/
│   ├── features/                # Feature-based modules
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   └── components/
│   │   │
│   │   ├── search/
│   │   │   ├── screens/
│   │   │   │   └── SearchScreen.tsx
│   │   │   ├── components/
│   │   │   └── maps/
│   │   │       ├── NativeMap.tsx
│   │   │       └── WebMap.tsx
│   │   │
│   │   ├── events/
│   │   │   ├── screens/
│   │   │   │   └── CreateEventScreen.tsx
│   │   │   ├── components/
│   │   │   └── modals/
│   │   │       ├── EventDetailsBottomSheet.tsx
│   │   │       ├── ContactRequestBottomSheet.tsx
│   │   │       ├── LocationPickerModal.tsx
│   │   │       ├── TimePickerModal.tsx
│   │   │       └── SuccessModal.tsx
│   │   │
│   │   ├── chats/
│   │   │   ├── screens/
│   │   │   │   ├── ChatsListScreen.tsx
│   │   │   │   └── ChatScreen.tsx
│   │   │   └── components/
│   │   │       └── RequestCard.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── screens/
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── UserProfileScreen.tsx
│   │   │   └── components/
│   │   │
│   │   └── onboarding/
│   │       └── screens/
│   │           └── OnboardingScreen.tsx
│   │
│   └── shared/                  # Shared resources
│       ├── components/
│       │   ├── AudioPlayer.tsx
│       │   ├── AudioRecorder.tsx
│       │   ├── AvatarPicker.tsx
│       │   ├── AvatarPicker.web.tsx
│       │   └── InterestPicker.tsx
│       ├── contexts/
│       │   ├── AuthContext.tsx
│       │   ├── CreateEventContext.tsx
│       │   └── index.ts
│       ├── hooks/
│       │   └── useFrameworkReady.ts
│       ├── lib/
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   ├── supabase.ts
│       │   └── index.ts
│       └── utils/
│           └── location.ts
```

## Path Aliases

У `tsconfig.json` налаштовані наступні aliases:

```json
{
  "paths": {
    "@/*": ["./*"],
    "@features/*": ["./src/features/*"],
    "@shared/*": ["./src/shared/*"]
  }
}
```

## Приклади імпортів

### Старі імпорти:
```typescript
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import WebMap from '../../components/WebMap';
```

### Нові імпорти:
```typescript
import { useAuth } from '@shared/contexts';
import { supabase } from '@shared/lib';
import WebMap from '@features/search/maps/WebMap';
```

## Переваги нової структури

1. **Feature-based organization** - всі файли однієї фічі в одному місці
2. **Легше знайти код** - зрозуміло де шукати компоненти для конкретної фічі
3. **Кращий scaling** - легко додавати нові фічі
4. **Чіткий поділ** - shared vs feature-specific код
5. **Менше конфліктів** - команди можуть працювати над різними фічами незалежно

## Міграція завершена

- ✅ Створена нова структура папок
- ✅ Скопійовані всі файли
- ✅ Оновлені імпорти в feature файлах
- ✅ Створені re-exports в app/ для Expo Router
- ✅ Налаштовані path aliases в tsconfig.json
- ✅ Створені index файли для зручного експорту

## Наступні кроки

Старі папки `components/`, `contexts/`, `hooks/`, `lib/`, `utils/` можна видалити після перевірки що все працює.
