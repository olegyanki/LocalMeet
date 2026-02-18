# Design Document: EventCard Redesign

## Overview

The EventCard component redesign transforms the existing vertical layout into a modern horizontal layout with improved visual hierarchy and enhanced interactivity. The new design prioritizes event imagery, provides quick actions (favorite and join), and presents information in a more scannable format.

The component remains in `src/shared/components/EventCard.tsx` as a reusable component used across the Search and Profile features.

## Architecture

### Component Structure

```
EventCard (Pressable)
├── Drag Handle (View)
├── Content Container (View)
│   ├── Event Image (Image/Avatar)
│   ├── Info Container (View)
│   │   ├── Title Row (View)
│   │   │   ├── Title (Text)
│   │   │   └── Favorite Button (Pressable)
│   │   ├── Description (Text)
│   │   └── Location & Time Row (View)
│   │       ├── Location Info (View)
│   │       │   ├── Location Icon
│   │       │   └── Distance Text
│   │       └── Time Badge (View)
│   │           ├── Blue Dot
│   │           └── Time Text
│   ├── Divider (View)
│   └── Footer (View)
│       ├── Host Info (View)
│       │   ├── Avatar (Pressable)
│       │   │   ├── Avatar Image
│       │   │   └── Online Indicator (conditional)
│       │   └── Host Text (View)
│       │       ├── "Hosted by" Label
│       │       └── Host Name
│       └── Join Button (Pressable, conditional)
```

### Data Flow

1. **Props Input**: Component receives NearbyWalk data, user ID, and callback functions
2. **State Management**: Internal state for favorite status (animated)
3. **Event Handling**: Separate handlers for card press, avatar press, favorite press, and join press
4. **Rendering**: Conditional rendering based on ownership and favorite status

## Components and Interfaces

### Props Interface

```typescript
interface EventCardProps {
  // Data
  item: NearbyWalk;
  currentUserId: string;
  
  // Callbacks
  onPress: () => void;
  onAvatarPress: () => void;
  onFavoritePress?: (eventId: string, isFavorited: boolean) => void;
  onJoinPress?: (eventId: string) => void;
  
  // Optional customization
  width?: number;
  isFavorited?: boolean;
  
  // i18n
  t: (key: TranslationKey, params?: Record<string, any>) => string;
}
```

### Internal State

```typescript
// Animated value for favorite button
const favoriteScale = useRef(new Animated.Value(1)).current;

// Derived state
const isOwnEvent = item.walk?.user_id === currentUserId;
const eventImageUrl = item.walk?.image_url;
const hostAvatarUrl = item.walk?.profiles?.avatar_url;
const hostName = item.walk?.profiles?.display_name || item.walk?.profiles?.username;
```

### Sub-Components

The component uses existing shared components:
- `Avatar` - For host avatar display
- Material Icons (via lucide-react-native or similar) - For icons

## Data Models

### NearbyWalk Type (existing)

```typescript
interface NearbyWalk {
  distance: number; // in meters
  walk: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    start_time: string;
    duration: number;
    image_url: string | null;
    latitude: number;
    longitude: number;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      is_online?: boolean;
    };
  } | null;
}
```

### New Constants

Add to `src/shared/constants/styles.ts`:

```typescript
export const CARD_STYLES = {
  eventCard: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 48,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  dragHandle: {
    width: 12,
    height: 1.5,
    backgroundColor: COLORS.GRAY_HANDLE,
    borderRadius: 1,
    alignSelf: 'center' as const,
    marginBottom: 12,
  },
};

export const EVENT_IMAGE_SIZE = 96;
export const HOST_AVATAR_SIZE = 40;
export const ONLINE_INDICATOR_SIZE = 12;
```

Add to `src/shared/constants/colors.ts`:

```typescript
// Add if not present
SUBTEXT_LIGHT: '#6B7280',
SUBTEXT_DARK: '#9CA3AF',
TIME_BADGE_BG: '#EFF6FF',
TIME_BADGE_TEXT: '#3B82F6',
ONLINE_INDICATOR: '#10B981',
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Event ownership determines UI elements

*For any* EventCard with a given currentUserId and event user_id, when the IDs match, the card should hide the Join button and display "Your Event" instead of distance.

**Validates: Requirements 5.5, 8.6**

### Property 2: Favorite button prevents event propagation

*For any* EventCard, when the favorite button is pressed, the onFavoritePress callback should be invoked and the onPress callback should NOT be invoked.

**Validates: Requirements 3.5**

### Property 3: Avatar press prevents event propagation

*For any* EventCard, when the host avatar is pressed, the onAvatarPress callback should be invoked and the onPress callback should NOT be invoked.

**Validates: Requirements 7.6**

### Property 4: Join button prevents event propagation

*For any* EventCard, when the Join button is pressed, the onJoinPress callback should be invoked and the onPress callback should NOT be invoked.

**Validates: Requirements 8.5**

### Property 5: Image display fallback

*For any* EventCard, when the event has no image_url (null or undefined), the component should display a placeholder without crashing.

**Validates: Requirements 2.2**

### Property 6: Description line clamping

*For any* EventCard with a description longer than 3 lines, the displayed text should be truncated with ellipsis at the 3rd line.

**Validates: Requirements 4.2**

### Property 7: Online indicator visibility

*For any* EventCard, the online indicator should be visible if and only if the host's is_online property is true.

**Validates: Requirements 7.2**

### Property 8: Touch target minimum size

*For any* interactive element (favorite button, avatar, join button) in the EventCard, the touchable area should be at least 44x44px.

**Validates: Requirements 10.2**

### Property 9: Dark mode color adaptation

*For any* EventCard, when rendered in dark mode, all color values should use their dark mode equivalents (borders, backgrounds, text).

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 10: Time formatting consistency

*For any* EventCard with a valid start_time and duration, the time badge should display the time range in "HH:MM - HH:MM" format.

**Validates: Requirements 5.3**

## Error Handling

### Image Loading Errors

```typescript
// Handle event image load failure
const [imageError, setImageError] = useState(false);

<Image
  source={{ uri: eventImageUrl }}
  onError={() => setImageError(true)}
  style={styles.eventImage}
/>

// Fallback to placeholder
{(imageError || !eventImageUrl) && (
  <View style={[styles.eventImage, styles.imagePlaceholder]}>
    <ImageIcon size={32} color={COLORS.GRAY_PLACEHOLDER} />
  </View>
)}
```

### Missing Data Handling

```typescript
// Gracefully handle missing profile data
const hostName = item.walk?.profiles?.display_name 
  || item.walk?.profiles?.username 
  || t('unknownHost');

// Handle missing description
{item.walk?.description && (
  <Text style={styles.description} numberOfLines={3}>
    {item.walk.description}
  </Text>
)}
```

### Callback Safety

```typescript
// Ensure callbacks exist before invoking
const handleFavoritePress = (e: GestureResponderEvent) => {
  e.stopPropagation();
  if (onFavoritePress && item.walk?.id) {
    onFavoritePress(item.walk.id, !isFavorited);
  }
};
```

## Testing Strategy

### Unit Tests

Unit tests should focus on specific examples and edge cases:

1. **Rendering Tests**
   - Renders correctly with complete data
   - Renders correctly with minimal data (no description, no image)
   - Renders correctly for own events (no join button, "Your Event" text)
   - Renders correctly with favorited state

2. **Interaction Tests**
   - Card press triggers onPress callback
   - Favorite button press triggers onFavoritePress and stops propagation
   - Avatar press triggers onAvatarPress and stops propagation
   - Join button press triggers onJoinPress and stops propagation

3. **Edge Cases**
   - Handles null/undefined image_url
   - Handles missing profile data
   - Handles very long descriptions (truncation)
   - Handles very long event titles (truncation)
   - Handles missing callbacks gracefully

### Property-Based Tests

Property tests should verify universal properties across all inputs (minimum 100 iterations per test):

1. **Property Test: Event ownership UI**
   - Generate random events with varying user_ids
   - Verify Join button visibility matches ownership logic
   - Tag: **Feature: event-card-redesign, Property 1: Event ownership determines UI elements**

2. **Property Test: Event propagation prevention**
   - Generate random events
   - Simulate presses on favorite, avatar, and join buttons
   - Verify onPress is never called when child buttons are pressed
   - Tag: **Feature: event-card-redesign, Property 2-4: Button press prevents event propagation**

3. **Property Test: Image fallback**
   - Generate events with null, undefined, and invalid image URLs
   - Verify component renders without crashing
   - Tag: **Feature: event-card-redesign, Property 5: Image display fallback**

4. **Property Test: Text truncation**
   - Generate events with descriptions of varying lengths (0-1000 characters)
   - Verify descriptions longer than 3 lines are truncated
   - Tag: **Feature: event-card-redesign, Property 6: Description line clamping**

5. **Property Test: Touch target sizes**
   - Measure rendered dimensions of all interactive elements
   - Verify all touch targets are at least 44x44px
   - Tag: **Feature: event-card-redesign, Property 8: Touch target minimum size**

### Testing Library

Use **Jest** with **React Native Testing Library** for unit and property-based tests. For property-based testing, use **fast-check** library.

```bash
npm install --save-dev fast-check
```

### Test Configuration

Each property test should run with:
- Minimum 100 iterations
- Seed for reproducibility
- Verbose output on failure

```typescript
import fc from 'fast-check';

fc.assert(
  fc.property(
    eventArbitrary,
    (event) => {
      // Test property
    }
  ),
  { numRuns: 100, verbose: true }
);
```

## Implementation Notes

### Animation Details

```typescript
// Favorite button animation
const animateFavorite = () => {
  Animated.sequence([
    Animated.timing(favoriteScale, {
      toValue: 1.2,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(favoriteScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};
```

### Layout Calculations

```typescript
// Time range calculation
const getTimeRange = (startTime: string, duration: number) => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000);
  return `${formatHHMM(start)} - ${formatHHMM(end)}`;
};

const formatHHMM = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
```

### Accessibility

```typescript
<Pressable
  accessible={true}
  accessibilityLabel={`Event: ${item.walk?.title}`}
  accessibilityRole="button"
  accessibilityHint="Tap to view event details"
  onPress={onPress}
>
  {/* Card content */}
</Pressable>

<Pressable
  accessible={true}
  accessibilityLabel={isFavorited ? "Remove from favorites" : "Add to favorites"}
  accessibilityRole="button"
  onPress={handleFavoritePress}
>
  {/* Favorite icon */}
</Pressable>
```

### Performance Considerations

1. **Memoization**: Use `React.memo` to prevent unnecessary re-renders
2. **Image Optimization**: Use appropriate image sizes and caching
3. **Animation**: Use `useNativeDriver: true` for all animations
4. **Callback Stability**: Ensure parent components use `useCallback` for props

```typescript
export default React.memo(EventCard, (prevProps, nextProps) => {
  return (
    prevProps.item.walk?.id === nextProps.item.walk?.id &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});
```
