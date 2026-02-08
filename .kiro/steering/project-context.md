# LocalMeet Project Context

## Tech Stack
- React Native + Expo (54.0.10)
- TypeScript
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- Leaflet (WebView для всіх платформ) + Mapbox style
- Expo Router (file-based routing)

## Architecture
- Feature-based structure: `src/features/{feature}/screens|components|modals`
- Shared resources: `src/shared/components|constants|contexts|lib|utils|i18n`
- Path aliases: `@features/*`, `@shared/*`

## Key Features
- Real-time map with nearby events (до 15 км)
- Event creation with time/location
- Walk requests & chats
- i18n (українська, English)

## Database (Supabase)
- profiles, walks, user_locations, walk_requests, chats, messages
- Storage: avatars, chat-images, chat-audio

## Important Patterns
- Centralized colors/styles in `@shared/constants`
- All text via `t('key')` from useI18n()
- Real-time via Supabase subscriptions
