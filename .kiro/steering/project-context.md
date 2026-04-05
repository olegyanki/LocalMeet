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

### Navigation Structure
```
app/
├── _layout.tsx              # Root Stack Navigator
├── (tabs)/                  # Tab Navigator (with tab bar)
│   ├── (search)/           # Search tab with nested stack
│   │   ├── _layout.tsx     # Stack navigator for search
│   │   ├── index.tsx       # Search screen (map + events)
│   │   └── event/[id].tsx  # Event details (within search context)
│   ├── (profile)/          # Profile tab with nested stack
│   │   ├── _layout.tsx     # Stack navigator for profile
│   │   ├── index.tsx       # Profile screen
│   │   └── event/[id].tsx  # Event details (within profile context)
│   ├── create-event.tsx    # Create event screen
│   ├── chats.tsx           # Chats list screen
│   ├── settings.tsx        # Settings screen
│   └── onboarding.tsx      # Onboarding (hidden from tabs)
├── chat/                    # Chat screens (outside tabs)
│   └── [id].tsx            # Individual chat screen
├── user/                    # User profile screens (outside tabs)
│   └── [id].tsx            # Other user's profile screen
└── auth/                    # Auth screens (outside tabs)
    ├── login.tsx
    └── register.tsx
```

**Navigation Rules:**
- Screens inside `(tabs)/` show the tab bar at the bottom
- Screens outside `(tabs)/` (chat, user, auth) hide the tab bar
- `(search)` and `(profile)` are route groups with nested stacks
- Event details exist in both search and profile stacks to keep tab bar visible
- Groups with parentheses `(folder)` don't add URL segments
- Use `router.push('/event/[id]')` to navigate to event details (works from any context)
- Use `router.push('/chat/[id]')` for chat (hides tab bar)
- Use `router.push('/user/[id]')` for user profile (hides tab bar)

### Path Aliases
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`

## Database Schema (Supabase)

### Tables
- `profiles` - User profiles (username, bio, avatar, interests, languages)
- `walks` - Events/walks (title, time, location, description)
  - **IMPORTANT**: `duration` field is stored in **seconds**, not minutes
- `user_locations` - Real-time user locations
- `walk_requests` - Walk join requests (pending/accepted/rejected)
- `chats` - Chat rooms (both group and direct chats)
  - `type` - 'group' for event chats, 'direct' for 1-on-1 chats
  - `walk_id` - Links group chats to events (NULL for direct chats)
- `chat_participants` - Junction table for chat membership
  - `role` - 'owner' or 'member' (owners can manage group chats)
- `messages` - Chat messages

### Key Types
- `UserProfile` - User profile data (id, username, display_name, bio, avatar_url, etc.)
- `Walk` - Event/walk data (id, user_id, title, start_time, location, etc.)
  - **duration**: number (in seconds)
- `NearbyWalk` - Walk with distance (distance, walk, host, my_request_status)
- `WalkRequest` - Join request (id, walk_id, requester_id, status, message)
- `Chat` - Universal chat interface (works for both group and direct chats)
- `ChatParticipant` - Chat participant with profile information
- `ChatWithDetails` - Chat with participants, last message, and event info
- `Message` - Chat message (text, image, or audio) with sender profile

### Storage Buckets
- `avatars` - User avatar images
- `event-images` - Event cover images
- `chat-images` - Chat image messages
- `chat-audio` - Chat audio messages

### RPC Functions
- `get_nearby_walks(lat, lng, radius_km)` - Get walks within radius with distance
- `get_nearby_walks_filtered(lat, lng, radius_km, interests, time_filter, max_distance, user_id)` - Filtered geospatial search. Optional `user_id` returns `my_request_status` per walk
- `get_my_chats_optimized(user_id)` - Get all user chats with details (optimized single query)
- `get_chat_details(chat_id, user_id)` - Get chat details with participants

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

### Group Chat System & Direct Messaging
- **Group Chats (Regular Events, `type = 'event'`)**: Automatically created when event is created
  - Event creator becomes chat owner
  - Participants added when walk requests are accepted
  - Owner can remove participants
  - Ownership transfers if owner leaves
- **Group Chats (Live Events, `type = 'live'`)**: Created lazily (not on event creation)
  - Chat is created when first walk request is accepted (via DB trigger)
  - Or when owner opens chat via `getOrCreateChatForWalk(walkId, userId)`
  - Empty chats of finished live events are hidden from chat list (filtered in RPC, not deleted)
  - Chat name: non-owner sees "Прогулянка [owner name]", owner sees "Твоя прогулянка · [date]"
  - Chat avatar: owner's profile avatar instead of event image
- **Direct Chats**: Migrated from old 1-on-1 system
  - Both participants have equal member status
  - Preserved from previous chat system
- **Universal API**: Same functions work for both chat types
- Text, image, audio messages with sender profiles
- Real-time message delivery to all participants
- Unread count tracking (excludes sender's own messages)

### i18n
- Ukrainian (uk) and English (en)
- All text via `t('key')` from `useI18n()`
- Translations in `src/shared/i18n/locales/`
- Live event chat keys: `walkTitle` ("Walk"/"Прогулянка"), `walkOfName` ("{{name}}'s walk"/"Прогулянка {{name}}"), `yourWalk` ("Your walk"/"Твоя прогулянка"), `walkChatCreated` ("Walk chat created"/"Чат прогулянки створено")

## Important Patterns

### API Calls
Always use functions from `@shared/lib/api.ts`:

```tsx
import { 
  updateProfile, 
  getNearbyWalks, 
  createWalk,
  getMyChats,
  getChatMessages,
  sendMessage,
  leaveChat,
  removeChatParticipant,
  markChatAsRead,
  getOrCreateChatForWalk
} from '@shared/lib/api';

// Update profile
await updateProfile(userId, { bio: 'New bio' });

// Get nearby walks
const walks = await getNearbyWalks(latitude, longitude, 15);

// Create walk (automatically creates group chat)
await createWalk({
  userId,
  title: 'Coffee walk',
  startTime: '2024-01-20T15:00:00',
  duration: 60,
  latitude,
  longitude,
});

// Get user's chats (both group and direct chats)
const chats = await getMyChats(userId);

// Get messages for any chat (group or direct)
const messages = await getChatMessages(chatId);

// Send message (works for both chat types)
await sendMessage(chatId, userId, {
  content: 'Hello everyone!',
  type: 'text'
});

// Chat management (group chats)
await leaveChat(chatId, userId);
await removeChatParticipant(chatId, participantId); // Owner only
await markChatAsRead(chatId, userId);

// Get or create chat for live events (lazy creation)
const chatId = await getOrCreateChatForWalk(walkId, userId);

// Legacy functions (deprecated)
// await createChatFromRequest() - REMOVED
// await getChatById() - REMOVED
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

**Badge Count System:**
- Uses real-time subscriptions for instant updates (no polling)
- Fallback refresh only when app returns to foreground
- 5-minute cache to avoid unnecessary API calls
- Subscribes to: messages, walk_requests, chat_participants tables

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
