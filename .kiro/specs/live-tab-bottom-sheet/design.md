# Design Document: Live Tab Bottom Sheet

## Overview

This feature replaces the direct navigation to `create-event` tab when the "+" button is tapped. Instead, a bottom sheet slides up over the current screen, presenting a minimal "Live" form that lets users publish their current walking status as a map sticker. A secondary action inside the sheet navigates to the full event creation flow.

The change is entirely contained within the tab layout and a new `LiveBottomSheet` component — no new routes are added, and the existing `create-event` tab remains intact.

---

## Architecture

### Component Placement

`LiveBottomSheet` lives at `src/features/live/components/LiveBottomSheet.tsx`. It is rendered as a sibling to `<Tabs>` inside the `TabLayout` component in `app/(tabs)/_layout.tsx`, using absolute positioning to overlay the entire screen including the tab bar.

```
app/(tabs)/_layout.tsx
├── <Tabs> (existing tab navigator)
│   └── create-event tab (kept, href not null)
└── <LiveBottomSheet>  ← new, rendered conditionally
```

This avoids adding a new route and keeps the bottom sheet outside the navigation stack.

### Plus Button Interception

The `create-event` tab uses the `tabBarButton` render prop to replace the default pressable with a custom component that calls `setIsVisible(true)` instead of navigating. The tab itself remains in the navigator so the route is still reachable via the secondary action.

```tsx
<Tabs.Screen
  name="create-event"
  options={{
    tabBarButton: (props) => (
      <PlusTabButton {...props} onPress={() => setIsVisible(true)} />
    ),
  }}
/>
```

### State Management

`isVisible: boolean` lives in `useState` inside `TabLayout`. It is passed as a prop to `LiveBottomSheet`. No context or global state is needed — the sheet is only ever opened from the tab bar.

---

## Components and Interfaces

### `LiveBottomSheet`

**Path:** `src/features/live/components/LiveBottomSheet.tsx`

```tsx
interface LiveBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToCreateEvent: () => void;
}
```

Internally renders:
- `Modal` with `transparent` and `visible={isVisible}` — provides the overlay layer and handles Android back button
- Overlay `TouchableOpacity` (rgba(0,0,0,0.5)) — tapping closes the sheet
- Animated sheet container — holds the drag handle and `LiveScreen`
- `PanResponder` — handles swipe-to-dismiss

### `LiveScreen`

**Path:** `src/features/live/components/LiveScreen.tsx`

```tsx
interface LiveScreenProps {
  onClose: () => void;
  onNavigateToCreateEvent: () => void;
}
```

Contains the form UI: title, subtitle, `TextInput`, `PrimaryButton`, secondary action row. Manages its own `statusText` and `isSubmitting` / `error` state.

### `PlusTabButton`

**Path:** `src/features/live/components/PlusTabButton.tsx` (or inline in `_layout.tsx` if small enough)

A thin wrapper that accepts the standard `tabBarButton` props and an `onPress` override. Renders the same `Plus` icon and label as the original tab button.

---

## Data Models

### Live Walk (Database)

A live sticker is stored as a regular row in the existing `walks` table — no new table needed. The only schema change is adding a `type` column to distinguish live walks from planned events.

**Database decision:** Add `type TEXT DEFAULT 'event' CHECK (type IN ('event', 'live'))` to `walks`. A live walk sets `start_time = NOW()`, `duration = 7200` (2 hours in seconds), and `title` = the user's status text. All existing infrastructure — `walk_requests`, group chat trigger, `get_nearby_walks` RPC, event details screen — works automatically with zero changes.

Migration: `npx supabase migration new add_type_to_walks`

```sql
ALTER TABLE walks
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'event'
  CHECK (type IN ('event', 'live'));

CREATE INDEX IF NOT EXISTS idx_walks_type ON walks(type);
```

Existing rows default to `'event'` — no data migration needed.

### Live Walk lifecycle

- Created with `start_time = NOW()`, `duration = 7200` (2h)
- Expires naturally: `get_nearby_walks` already filters by time, so live walks disappear from the map after 2 hours
- `deleted = true` can be used to manually remove a live walk early (e.g. "go offline" action in future)

### API Function

New function added to `src/shared/lib/api.ts`:

```ts
interface CreateLiveWalkParams {
  userId: string;
  latitude: number;
  longitude: number;
  statusText: string;
}

export async function createLiveWalk(params: CreateLiveWalkParams): Promise<Walk>
```

Calls `supabase.from('walks').insert(...)` with:
- `user_id`: params.userId
- `title`: params.statusText (or a default if empty)
- `description`: null
- `latitude` / `longitude`: params coordinates
- `start_time`: `new Date().toISOString()`
- `duration`: `7200` (2 hours in seconds)
- `type`: `'live'`

### i18n Keys

New keys added to both `uk.json` and `en.json`:

| Key | Ukrainian | English |
|-----|-----------|---------|
| `liveTitle` | Я зараз гуляю | I'm out walking |
| `liveSubtitle` | Поділись що робиш і знайди компанію поруч | Share what you're doing and find company nearby |
| `livePlaceholder` | Йду пити каву біля моря, приєднуйтесь | Going for coffee by the sea, join me |
| `livePublishButton` | Показати на карті | Show on map |
| `liveSecondaryText` | Хочеш щось запланувати? | Want to plan something? |
| `liveSecondaryButton` | Створити івент → | Create event → |
| `livePublishError` | Не вдалося опублікувати статус | Failed to publish status |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Plus button press does not change active tab

*For any* currently active tab, pressing the Plus button should leave the active tab index unchanged (i.e., the tab navigator does not navigate to `create-event`).

**Validates: Requirements 1.1, 1.4**

---

### Property 2: Plus button press makes the sheet visible

*For any* initial `isVisible` state of `false`, pressing the Plus button should result in `isVisible` becoming `true`.

**Validates: Requirements 1.2**

---

### Property 3: Sheet height is 70% of screen height

*For any* device screen height, the computed height of the `LiveBottomSheet` container should equal `Math.round(screenHeight * 0.7)`.

**Validates: Requirements 2.3**

---

### Property 4: Swipe threshold controls dismiss

*For any* downward pan gesture, the sheet should call its dismiss handler if and only if the gesture's `dy` value exceeds 80px at release.

**Validates: Requirements 2.7**

---

### Property 5: Overlay visibility matches sheet visibility

*For any* value of `isVisible`, the overlay with `rgba(0,0,0,0.5)` background should be rendered if and only if `isVisible` is `true`.

**Validates: Requirements 2.9**

---

### Property 6: Live screen renders all translated strings

*For any* supported language (uk, en), all text elements in `LiveScreen` (title, subtitle, placeholder, publish button, secondary text, secondary button) should render the string returned by `t(key)` for their respective translation key.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

### Property 7: Safe area bottom padding invariant

*For any* `insets.bottom` value, the `paddingBottom` applied to the `LiveScreen` scroll container should equal `insets.bottom + 16`.

**Validates: Requirements 3.7**

---

### Property 8: KeyboardAvoidingView behavior is platform-correct

*For any* platform value, the `behavior` prop of `KeyboardAvoidingView` inside `LiveBottomSheet` should be `'padding'` on iOS and `'height'` on Android.

**Validates: Requirements 4.2**

---

### Property 9: Publish calls API with correct arguments

*For any* status text entered by the user and any current user location, tapping the publish button should invoke `createLiveWalk` with `{ userId, latitude, longitude, statusText }` matching those values.

**Validates: Requirements 5.1**

---

### Property 10: Successful publish closes the sheet

*For any* successful `createLiveWalk` call, `isVisible` should transition to `false` after the call resolves.

**Validates: Requirements 5.2**

---

### Property 11: Loading state disables the button

*For any* moment when `isSubmitting` is `true`, the `PrimaryButton` should have `loading={true}` and `disabled={true}`.

**Validates: Requirements 5.3**

---

### Property 12: API failure shows error without closing

*For any* `createLiveWalk` call that throws, the `error` state should be set to the `livePublishError` translation string and `isVisible` should remain `true`.

**Validates: Requirements 5.4**

---

### Property 13: Empty status text does not disable publish button

*For any* `statusText` value (including empty string), the `PrimaryButton` should not be `disabled` due to empty text alone.

**Validates: Requirements 5.5**

---

### Property 14: Secondary button closes sheet then navigates

*For any* state where the sheet is visible, tapping the secondary "Створити івент →" button should first set `isVisible` to `false`, then call `router.push` (or equivalent) to navigate to `create-event` after the dismiss animation completes.

**Validates: Requirements 6.1, 6.2**

---

### Property 15: Both locales contain all required live keys

*For any* required live i18n key (`liveTitle`, `liveSubtitle`, `livePlaceholder`, `livePublishButton`, `liveSecondaryText`, `liveSecondaryButton`, `livePublishError`), both `uk.json` and `en.json` should contain a non-empty string value for that key.

**Validates: Requirements 7.2, 7.3**

---

### Property 16: Sheet is not rendered when not visible

*For any* state where `isVisible` is `false`, the `LiveBottomSheet` sheet container should either not be mounted or have `display: 'none'` applied, preventing unnecessary renders.

**Validates: Requirements 8.3**

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| `createLiveWalk` API throws | Set `error` state to `t('livePublishError')`, keep sheet open, re-enable button |
| Location permission denied / unavailable | Show error — location is required to place a live walk on the map |
| Network timeout | Same as API throw — inline error message |
| User dismisses during API call | Cancel is not blocked; if the call resolves after dismiss, ignore the result (check mounted state) |

Error display uses the existing form-level error pattern from the design system:

```tsx
{error ? (
  <Text style={styles.errorText}>{error}</Text>
) : null}
```

Styled with `COLORS.ERROR_RED`, `COLORS.ERROR_BG`, `borderRadius: 16`, consistent with `CreateEventScreen`.

---

## Testing Strategy

### Unit Tests

Focus on specific examples and edge cases:

- `LiveBottomSheet` renders overlay when `isVisible=true`, does not render when `false`
- `PlusTabButton` calls `onPress` prop instead of default tab navigation
- `LiveScreen` renders all 7 i18n keys
- `LiveScreen` publish button is enabled when `statusText` is empty
- `LiveScreen` publish button shows loading state when `isSubmitting=true`
- Secondary button triggers close + navigation callback
- Both locale files contain all 7 required keys (snapshot test)

### Property-Based Tests

Use a property-based testing library (e.g. `fast-check` for TypeScript/Jest, already compatible with the existing Jest setup).

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: live-tab-bottom-sheet, Property N: <property_text>`

| Property | Test approach |
|----------|--------------|
| P3: Sheet height = 70% screen | Generate random `screenHeight` values (100–2000), assert `Math.round(h * 0.7)` |
| P4: Swipe threshold | Generate random `dy` values; assert dismiss called iff `dy > 80` |
| P5: Overlay visibility | Generate random `isVisible` booleans; assert overlay rendered iff true |
| P7: Safe area padding | Generate random `insets.bottom` (0–100); assert `paddingBottom === insets.bottom + 16` |
| P8: KAV behavior | Generate `Platform.OS` as 'ios' or 'android'; assert correct behavior string |
| P9: API call arguments | Generate random `statusText` strings and lat/lng pairs; assert `createLiveWalk` called with matching args |
| P11: Loading disables button | Generate random `isSubmitting` booleans; assert `disabled === isSubmitting` |
| P13: Empty text doesn't disable | Generate strings including empty string; assert button never disabled due to text alone |
| P15: Locale completeness | For each of 7 keys, assert both locales have non-empty string |
| P16: Hidden when not visible | Generate `isVisible=false`; assert sheet container absent or `display: 'none'` |

### Integration Notes

- The `createLiveWalk` API function should be tested against the local Supabase instance following the existing `__tests__/database/` pattern
- After the migration is applied, add a preservation test confirming existing `walks` queries (e.g. `get_nearby_walks`) still work correctly for `type = 'event'` rows
- The `type` column defaults to `'event'` so all existing event creation flows are unaffected
