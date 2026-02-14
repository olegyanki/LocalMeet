# LocalMeet Project Context

## Tech Stack
- React Native + Expo (54.0.10)
- TypeScript
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- Leaflet (WebView) + Mapbox style
- Expo Router (file-based routing)

## Architecture

### Folder Structure
```
src/
├── features/          # Feature-based modules
│   ├── auth/         # Login, register screens
│   ├── chats/        # Chat list, chat screen
│   ├── events/       # Create event screen
│   ├── event-details/# Event details screen
│   ├── onboarding/   # Onboarding flow
│   ├── profile/      # Profile, settings screens
│   └── search/       # Map search screen
└── shared/           # Shared resources
    ├── components/   # Reusable UI components
    ├── constants/    # Colors, styles, sizes
    ├── contexts/     # React contexts (Auth, CreateEvent)
    ├── hooks/        # Custom hooks
    ├── i18n/         # Internationalization
    ├── lib/          # API, auth, Supabase client
    └── utils/        # Helper functions
```

### Path Aliases
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`

## Database Schema (Supabase)

### Tables
- `profiles` - User profiles (username, bio, avatar, interests, languages)
- `walks` - Events/walks (title, time, location, description)
- `user_locations` - Real-time user locations
- `walk_requests` - Walk join requests (pending/accepted/rejected)
- `chats` - Chat rooms
- `messages` - Chat messages

### Key Types
- `UserProfile` - User profile data (id, username, display_name, bio, avatar_url, etc.)
- `Walk` - Event/walk data (id, user_id, title, start_time, location, etc.)
- `NearbyWalk` - Walk with distance (distance, walk)
- `WalkRequest` - Join request (id, walk_id, requester_id, status, message)
- `Chat` - Chat room with participants
- `Message` - Chat message (text, image, or audio)

### Storage Buckets
- `avatars` - User avatar images
- `event-images` - Event cover images
- `chat-images` - Chat image messages
- `chat-audio` - Chat audio messages

### RPC Functions
- `get_nearby_walks(lat, lng, radius_km)` - Get walks within radius with distance

## Key Features

### Real-time Map
- Shows nearby events within 15km
- User location tracking
- Event markers with user info
- Filter by interests, time, distance

### Event Creation
- Title, description, time, duration
- Location picker (map)
- Optional cover image
- Auto-delete after event time

### Walk Requests & Chats
- Send request to join walk
- Accept/reject requests
- Auto-create chat on accept
- Text, image, audio messages

### i18n
- Ukrainian (uk) and English (en)
- All text via `t('key')` from `useI18n()`
- Translations in `src/shared/i18n/locales/`

## Important Patterns

### API Calls
Always use functions from `@shared/lib/api.ts`:

```tsx
import { 
  updateProfile, 
  getNearbyWalks, 
  createWalk,
  getMyChats,
  createChatFromRequest 
} from '@shared/lib/api';

// Update profile
await updateProfile(userId, { bio: 'New bio' });

// Get nearby walks
const walks = await getNearbyWalks(latitude, longitude, 15);

// Create walk
await createWalk({
  userId,
  title: 'Coffee walk',
  startTime: '2024-01-20T15:00:00',
  duration: 60,
  latitude,
  longitude,
});

// Get user's chats with last messages
const chats = await getMyChats(userId);

// Create chat from accepted request
const chatId = await createChatFromRequest(requestId, requesterId, walkerId);

// Send messages
await sendTextMessage(chatId, userId, 'Hello!');
await sendImageMessage(chatId, userId, imageUrl);
await sendAudioMessage(chatId, userId, audioUrl, duration);
```

### Authentication
Use `AuthContext` for auth state:

```tsx
import { useAuth } from '@shared/contexts';

const { user, profile, isLoading, refreshProfile } = useAuth();

// user - Supabase auth user
// profile - User profile from database
// refreshProfile() - Reload profile data
```

### Real-time Subscriptions
```tsx
useEffect(() => {
  const channel = supabase
    .channel('walks')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'walks',
    }, handleChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Styling
- Use constants from `@shared/constants`
- Colors: `COLORS.ACCENT_ORANGE`, `COLORS.TEXT_DARK`, etc.
- Styles: `BUTTON_STYLES`, `INPUT_STYLES`, `CHIP_STYLES`, etc.
- Sizes: `SIZES.AVATAR_MEDIUM`, `SIZES.TAB_BAR_HEIGHT`, etc.

### Time Formatting
Use functions from `@shared/utils/time.ts`:

```tsx
import { formatTime, getTimeColor } from '@shared/utils/time';
import { useI18n } from '@shared/i18n';

const { t } = useI18n();

// Format time with i18n
const timeText = formatTime(walk.start_time, t);
// Returns: "Starts in 30 min" or "Починається через 30 хв"

// Get color based on time
const color = getTimeColor(walk.start_time);
// Returns: COLORS.SUCCESS_GREEN (started), COLORS.ACCENT_ORANGE (soon), COLORS.TIME_BLUE (later)
```

**IMPORTANT:** `formatTime` and `getTimeText` require `t` function parameter for i18n support.

### Navigation
File-based routing with Expo Router:

```tsx
// Navigate to screen
router.push('/profile');
router.push(`/chat/${chatId}`);

// Go back
router.back();

// Replace (no back)
router.replace('/login');
```

### Error Handling
```tsx
try {
  setLoading(true);
  await apiCall();
} catch (error) {
  console.error('Error:', error);
  setError(t('errorMessage'));
} finally {
  setLoading(false);
}
```

## Development Workflow

### Running the App
```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in web browser
```

### Database Migrations
```bash
npx supabase migration new migration_name
npx supabase db push
```

### Type Generation
```bash
npx supabase gen types typescript --local > src/shared/lib/database.types.ts
```
