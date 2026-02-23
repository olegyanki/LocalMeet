# Design Document: Chats & Requests Redesign

## Overview

This design document specifies the technical implementation for redesigning the ChatsListScreen with a segmented control interface that separates "Messages" and "Requests" tabs. The redesign focuses on improving the user experience for managing walk join requests with distinct visual treatments for pending and past requests.

### Goals

- Implement a reusable SegmentedControl component for tab navigation
- Redesign RequestCard to display pending requests with action buttons
- Create a visual distinction between pending and past requests
- Implement request action handling (accept/decline) with chat creation
- Add relative timestamp formatting for request cards
- Maintain existing swipe gesture functionality for pending requests
- Ensure proper loading states and pull-to-refresh functionality

### Non-Goals

- Modifying the chat message interface or chat screen functionality
- Implementing real-time notifications for new requests
- Adding request filtering or search capabilities
- Modifying the walk request creation flow

## Architecture

### Component Hierarchy

```
ChatsListScreen
├── SegmentedControl (new)
│   ├── Segment (Messages)
│   └── Segment (Requests)
├── Messages Tab Content
│   ├── FlatList
│   └── ChatItem (existing)
└── Requests Tab Content
    ├── ScrollView (with sections)
    ├── Pending Requests Section
    │   ├── Section Header
    │   └── FlatList<RequestCard>
    └── Past Requests Section
        ├── Section Header
        └── FlatList<RequestCard>
```

### Data Flow

1. **Initial Load**: ChatsListScreen fetches both pending and past requests on mount
2. **Tab Switch**: User taps segmented control → state updates → content switches
3. **Request Action**: User accepts/declines → API call → chat creation (if accepted) → navigation → UI update
4. **Refresh**: User pulls to refresh → refetch current tab data → update state

### State Management

The ChatsListScreen will manage:
- `activeTab`: 'messages' | 'requests'
- `pendingRequests`: WalkRequestWithProfile[]
- `pastRequests`: WalkRequestWithProfile[]
- `chats`: ChatWithLastMessage[]
- `loading`: boolean
- `refreshing`: boolean
- `error`: string | null

## Components and Interfaces

### 1. SegmentedControl Component

**Location**: `src/shared/components/SegmentedControl.tsx`

**Purpose**: Reusable tab switcher with animated selection indicator

**Props Interface**:
```typescript
interface SegmentedControlProps {
  segments: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}
```

**Visual Specifications**:
- Container: Light gray background (#F2F2F7), 12px border radius, 3px padding
- Active segment: White background, shadow (0.06 opacity), 10px border radius
- Inactive segment: Transparent background
- Text: 15px, weight 600
- Active text color: TEXT_DARK (#333333)
- Inactive text color: TEXT_LIGHT (#999999)
- Height: 44px
- Segments: Equal flex distribution

**Implementation Notes**:
- Use TouchableOpacity for each segment
- Apply SHADOW.standard to active segment
- Segments should be horizontally aligned with flex: 1
- No animation required (instant state change)

### 2. RequestCard Component (Updated)

**Location**: `src/features/chats/components/RequestCard.tsx`

**Purpose**: Display walk request with user info, event details, and action buttons

**Props Interface**:
```typescript
interface RequestCardProps {
  request: WalkRequestWithProfile;
  isPast?: boolean;
  onReject?: (requestId: string) => void;
  onAccept?: (requestId: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onCardPress?: (userId: string) => void;
}
```

**Visual Specifications for Pending Requests**:
- Container: White background, 20px border radius, 20px padding
- Shadow: SHADOW.standard (0.06 opacity)
- Avatar: 48px diameter (SIZES.AVATAR_MEDIUM)
- Name: 17px, weight 600, TEXT_DARK
- Subtitle: "Wants to join your event" - 15px, TEXT_LIGHT
- Event name: 15px, weight 500, with Calendar icon (16px)
- Timestamp: 13px, TEXT_LIGHT, top-right corner
- Action buttons: Horizontally aligned, 8px gap
  - Decline: Light gray background (#F2F2F7), TEXT_DARK, 16px border radius
  - Accept: ACCENT_ORANGE background, white text, 16px border radius, SHADOW.elevated
  - Button padding: 12px vertical, 24px horizontal
  - Button text: 15px, weight 600

**Visual Specifications for Past Requests**:
- Same as pending but with modifications:
- Avatar: 40px diameter, grayscale filter
- Entire card: 60% opacity
- Status badge: Positioned after event name
  - "Joined": SUCCESS_GREEN background, white text
  - "Declined": #E8E8E8 background, TEXT_LIGHT
  - Badge: 6px vertical padding, 10px horizontal, 12px border radius
  - Badge text: 12px, weight 600
- No action buttons
- No swipe gestures

**Swipe Gesture Behavior** (Pending Only):
- Swipe right (>30% screen width): Accept
- Swipe left (>30% screen width): Decline
- Background colors: Green for accept, red for decline
- Icons: Check and X (28px, white, strokeWidth 3)
- Animation: Spring for return, timing for dismiss (250ms)

### 3. ChatsListScreen (Updated)

**Location**: `src/features/chats/screens/ChatsListScreen.tsx`

**Key Changes**:
1. Replace custom switch with SegmentedControl component
2. Separate requests into pending and past sections
3. Add section headers for requests
4. Update request handling to support past requests
5. Implement proper error handling with user feedback

**Layout Structure**:
```
- Screen title: "Messages" (28px, weight 700, 20px top padding)
- SegmentedControl: 24px horizontal margin, 16px bottom margin
- Content area:
  - Messages tab: FlatList of chat items
  - Requests tab: ScrollView with sections
    - Pending Requests section (if any)
      - Header: "Pending" (18px, weight 600, 24px horizontal padding)
      - FlatList of pending RequestCards
    - Past Requests section (if any)
      - Header: "Past" (18px, weight 600, 24px horizontal padding)
      - FlatList of past RequestCards
```

## Data Models

### Extended WalkRequest Types

```typescript
// Existing type from api.ts
export interface WalkRequestWithProfile extends WalkRequest {
  requester: UserProfile;
  walk: Walk;
}

// New type for categorized requests
interface CategorizedRequests {
  pending: WalkRequestWithProfile[];
  past: WalkRequestWithProfile[];
}
```

### Request Status

```typescript
type RequestStatus = 'pending' | 'accepted' | 'rejected';
```

## API Functions

### New API Functions

**Location**: `src/shared/lib/api.ts`

#### 1. getPendingWalkRequests

```typescript
export async function getPendingWalkRequests(
  userId: string
): Promise<WalkRequestWithProfile[]>
```

**Purpose**: Fetch only pending requests for user's walks

**Implementation**:
- Query walk_requests table
- Filter by walk.user_id = userId AND status = 'pending'
- Join with profiles and walks tables
- Order by created_at DESC
- Return WalkRequestWithProfile[]

#### 2. getPastWalkRequests

```typescript
export async function getPastWalkRequests(
  userId: string
): Promise<WalkRequestWithProfile[]>
```

**Purpose**: Fetch accepted and rejected requests for user's walks

**Implementation**:
- Query walk_requests table
- Filter by walk.user_id = userId AND status IN ('accepted', 'rejected')
- Join with profiles and walks tables
- Order by updated_at DESC
- Return WalkRequestWithProfile[]

**Note**: The existing `getMyWalkRequests` function will be updated to call both functions and return categorized results, or we can modify ChatsListScreen to call them separately.

## Utility Functions

### Relative Timestamp Formatting

**Location**: `src/shared/utils/time.ts`

#### formatRelativeTime

```typescript
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
```

**Purpose**: Convert ISO timestamp to relative time string

**Rules**:
- < 1 minute: "Just now"
- < 60 minutes: "Xm ago"
- < 24 hours: "Xh ago"
- ≥ 24 hours: "Xd ago"


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancy Analysis:**

1. **Request Card Styling Properties (2.2-2.9, 3.2-3.9, 7.1-7.9)**: Many individual styling requirements can be combined into comprehensive validation properties that check multiple style attributes at once rather than testing each individually.

2. **Tab Navigation (1.2, 1.3)**: These can be combined into a single property about tab switching behavior.

3. **Request Action Effects (4.1-4.4, 4.5-4.6)**: Accept and decline actions have similar effects (status update, UI update, section movement). These can be combined into properties about request action outcomes.

4. **Timestamp Formatting (8.1-8.3)**: These three criteria describe a single formatting function with different input ranges. They can be combined into one property about timestamp formatting correctness.

5. **Profile Navigation (9.1-9.2)**: Both pending and past request cards navigate to profile - can be combined into one property.

6. **Request Sorting (10.1-10.2)**: Both describe sorting behavior, can be validated together.

**Consolidated Properties:**

After reflection, the following properties provide comprehensive coverage without redundancy:

### Property 1: Tab Switching Updates Content

*For any* initial tab state (messages or requests), when the user switches to a different tab, the displayed content should change to match the selected tab.

**Validates: Requirements 1.2, 1.3**

### Property 2: Segmented Control Visual States

*For any* segmented control with multiple segments, the active segment should have white background and shadow styling, while inactive segments should have light gray background and no shadow.

**Validates: Requirements 1.4, 1.5**

### Property 3: Pending Request Card Completeness

*For any* pending request, the request card should display all required elements: avatar (48px), requester name (bold), "Wants to join your event" text, event name with icon, relative timestamp, and both "Decline" and "Accept" buttons.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 4: Pending Request Card Styling

*For any* pending request card, it should have white background, 20px border radius, and shadow styling applied.

**Validates: Requirements 2.8, 2.9, 7.1, 7.2, 7.3, 7.4**

### Property 5: Past Request Card Visual Treatment

*For any* past request, the request card should display avatar at 40px with grayscale filter, requester name, status text, appropriate status badge (green "Joined" for accepted, gray "Declined" for rejected), 60% opacity on the entire card, and no action buttons.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

### Property 6: Request Sections Display Conditionally

*For any* screen state where the Requests tab is active, the "Pending Requests" section should be displayed if and only if pending requests exist, and the "Past Requests" section should be displayed if and only if past requests exist, with Past appearing below Pending when both exist.

**Validates: Requirements 2.1, 3.1**

### Property 7: Accept Action Effects

*For any* pending request, when the accept action is triggered, the request status should update to "accepted", a chat should be created between host and requester, navigation to the chat should occur, and the request should move from pending to past requests section.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 8: Decline Action Effects

*For any* pending request, when the decline action is triggered, the request status should update to "rejected" and the request should move from pending to past requests section.

**Validates: Requirements 4.5, 4.6**

### Property 9: Request Action Error Handling

*For any* request action (accept or decline) that fails, an error message should be displayed to the user.

**Validates: Requirements 4.7**

### Property 10: UI Updates Without Manual Refresh

*For any* request action (accept or decline), the UI should update automatically to reflect the new state without requiring a manual refresh.

**Validates: Requirements 4.8**

### Property 11: Empty State Styling

*For any* empty state message (no requests or no chats), the message should be centered vertically and horizontally and use light gray text color.

**Validates: Requirements 5.3, 5.4**

### Property 12: Loading State Display

*For any* data loading operation (initial load or refresh), a loading indicator should be displayed in the app's accent orange color, and should be hidden when loading completes.

**Validates: Requirements 6.1, 6.3, 6.4, 6.5**

### Property 13: Pull-to-Refresh Behavior

*For any* active tab (messages or requests), pulling down to refresh should reload that tab's data.

**Validates: Requirements 6.2**

### Property 14: Timestamp Format Correctness

*For any* request timestamp, the relative time format should be: "Xm ago" for requests less than 60 minutes old, "Xh ago" for requests less than 24 hours old, and "Xd ago" for requests 24 hours or older, calculated relative to current time.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 15: Timestamp Updates on Refresh

*For any* request, when the screen is refreshed, the timestamp should be recalculated based on the current time.

**Validates: Requirements 8.5**

### Property 16: Request Card Navigation

*For any* request card (pending or past), tapping the card should navigate to the requester's profile screen with the requester's user ID passed as a parameter.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 17: Action Button Event Isolation

*For any* pending request card, tapping the action buttons (Accept or Decline) should not trigger the card's profile navigation.

**Validates: Requirements 9.4**

### Property 18: Request Sorting Order

*For any* list of pending requests, they should be sorted by creation time in descending order (newest first), and for any list of past requests, they should be sorted by update time in descending order (most recently processed first).

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 19: Action Button Styling

*For any* pending request card, the Accept button should have orange background with white text and shadow, while the Decline button should have light gray background with dark text, both with 16px border radius and proper padding.

**Validates: Requirements 7.5, 7.6, 7.7, 7.8, 7.9**

## Error Handling

### Request Action Failures

**Scenarios**:
1. Network failure during accept/decline
2. Chat creation failure
3. Database update failure
4. Invalid request ID

**Handling Strategy**:
- Wrap all API calls in try-catch blocks
- Display user-friendly error messages using toast or alert
- Log detailed errors to console for debugging
- Maintain UI state consistency (don't remove request from pending if action fails)
- Provide retry mechanism through pull-to-refresh

**Error Messages**:
- Accept failure: "Failed to accept request. Please try again."
- Decline failure: "Failed to decline request. Please try again."
- Chat creation failure: "Failed to create chat. Please try again."
- Load failure: "Failed to load requests. Pull to refresh."

### Data Loading Failures

**Scenarios**:
1. Network timeout
2. Authentication failure
3. Database query failure

**Handling Strategy**:
- Show error state with retry button
- Preserve last successfully loaded data
- Use pull-to-refresh as primary retry mechanism
- Display specific error messages when possible

### Navigation Failures

**Scenarios**:
1. Invalid user ID
2. Profile not found
3. Chat ID not found

**Handling Strategy**:
- Validate IDs before navigation
- Show error message if navigation fails
- Fall back to previous screen
- Log errors for debugging

## Testing Strategy

### Unit Testing

**Focus Areas**:
- SegmentedControl component rendering and interaction
- RequestCard component rendering for pending and past states
- Timestamp formatting utility function
- Request sorting logic
- Error handling paths

**Example Unit Tests**:
```typescript
describe('SegmentedControl', () => {
  it('should render all segments', () => {
    // Test that all provided segments are rendered
  });
  
  it('should call onChange when segment is tapped', () => {
    // Test interaction callback
  });
  
  it('should apply active styles to selected segment', () => {
    // Test styling based on activeIndex
  });
});

describe('formatRelativeTime', () => {
  it('should format recent times in minutes', () => {
    // Test < 60 minutes
  });
  
  it('should format times in hours', () => {
    // Test 60 minutes to 24 hours
  });
  
  it('should format old times in days', () => {
    // Test >= 24 hours
  });
});

describe('RequestCard', () => {
  it('should render pending request with action buttons', () => {
    // Test pending state rendering
  });
  
  it('should render past request without action buttons', () => {
    // Test past state rendering
  });
  
  it('should apply correct opacity to past requests', () => {
    // Test styling for past requests
  });
});
```

### Property-Based Testing

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**: Minimum 100 iterations per test

**Property Tests**:

```typescript
import fc from 'fast-check';

describe('Property Tests: Chats Requests Redesign', () => {
  
  // Property 1: Tab Switching Updates Content
  it('Feature: chats-requests-redesign, Property 1: For any initial tab state, switching tabs should update displayed content', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('messages', 'requests'),
        fc.constantFrom('messages', 'requests'),
        (initialTab, targetTab) => {
          // Setup screen with initialTab
          // Switch to targetTab
          // Assert content matches targetTab
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 3: Pending Request Card Completeness
  it('Feature: chats-requests-redesign, Property 3: For any pending request, card should display all required elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          requester_id: fc.uuid(),
          walk_id: fc.uuid(),
          message: fc.string(),
          status: fc.constant('pending'),
          created_at: fc.date().map(d => d.toISOString()),
          requester: fc.record({
            id: fc.uuid(),
            display_name: fc.string({ minLength: 1 }),
            avatar_url: fc.option(fc.webUrl(), { nil: null }),
          }),
          walk: fc.record({
            title: fc.string({ minLength: 1 }),
          }),
        }),
        (request) => {
          // Render RequestCard with request
          // Assert avatar is 48px
          // Assert name is displayed and bold
          // Assert "Wants to join your event" text exists
          // Assert event name with icon exists
          // Assert timestamp exists
          // Assert both action buttons exist
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 14: Timestamp Format Correctness
  it('Feature: chats-requests-redesign, Property 14: For any request timestamp, format should match time range', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (requestDate) => {
          const now = new Date();
          const diffMs = now.getTime() - requestDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          
          const formatted = formatRelativeTime(requestDate.toISOString());
          
          if (diffMins < 60) {
            // Should be in format "Xm ago"
            return formatted.endsWith('m ago');
          } else if (diffHours < 24) {
            // Should be in format "Xh ago"
            return formatted.endsWith('h ago');
          } else {
            // Should be in format "Xd ago"
            return formatted.endsWith('d ago');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 18: Request Sorting Order
  it('Feature: chats-requests-redesign, Property 18: For any list of requests, sorting should be correct', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
            status: fc.constantFrom('pending', 'accepted', 'rejected'),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (requests) => {
          const pending = requests.filter(r => r.status === 'pending');
          const past = requests.filter(r => r.status !== 'pending');
          
          // Sort pending by created_at DESC
          const sortedPending = [...pending].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Sort past by updated_at DESC
          const sortedPast = [...past].sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          
          // Assert sorting is correct
          for (let i = 0; i < sortedPending.length - 1; i++) {
            const current = new Date(sortedPending[i].created_at).getTime();
            const next = new Date(sortedPending[i + 1].created_at).getTime();
            if (current < next) return false;
          }
          
          for (let i = 0; i < sortedPast.length - 1; i++) {
            const current = new Date(sortedPast[i].updated_at).getTime();
            const next = new Date(sortedPast[i + 1].updated_at).getTime();
            if (current < next) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus Areas**:
- ChatsListScreen with real API calls (mocked Supabase)
- Request action flow: accept → chat creation → navigation
- Request action flow: decline → status update → UI update
- Pull-to-refresh functionality
- Tab switching with data loading

**Test Scenarios**:
1. Load screen with pending requests → verify display
2. Accept request → verify chat creation and navigation
3. Decline request → verify status update and UI change
4. Switch tabs → verify content changes
5. Pull to refresh → verify data reload
6. Handle API errors → verify error messages

### Manual Testing Checklist

- [ ] Segmented control switches between tabs smoothly
- [ ] Pending requests display with all required information
- [ ] Past requests display with correct visual treatment (opacity, grayscale)
- [ ] Accept button creates chat and navigates correctly
- [ ] Decline button updates status and moves to past section
- [ ] Timestamps display correctly for various time ranges
- [ ] Timestamps update after refresh
- [ ] Tapping card navigates to profile
- [ ] Tapping action buttons doesn't trigger navigation
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error messages display on failures
- [ ] Pull-to-refresh works on both tabs
- [ ] Swipe gestures work on pending requests
- [ ] Requests are sorted correctly
- [ ] UI updates automatically after actions

## Implementation Notes

### Performance Considerations

1. **List Rendering**: Use FlatList with proper keyExtractor for efficient rendering
2. **Memoization**: Use useMemo for filtered/sorted request lists
3. **Callback Stability**: Use useCallback for event handlers to prevent unnecessary re-renders
4. **Image Loading**: Use Avatar component which handles loading states
5. **Swipe Gestures**: Disable parent scroll when swiping cards

### Accessibility

1. **Touch Targets**: Ensure all buttons meet 44x44px minimum
2. **Labels**: Provide accessible labels for segmented control
3. **Screen Reader**: Ensure request cards announce all relevant information
4. **Color Contrast**: Verify text meets WCAG AA standards (4.5:1)

### Edge Cases

1. **No Requests**: Display empty state message
2. **Only Pending**: Hide past requests section
3. **Only Past**: Hide pending requests section
4. **Very Old Timestamps**: Handle dates beyond days (show "Xd ago" for all)
5. **Rapid Actions**: Prevent double-tapping action buttons
6. **Network Offline**: Show appropriate error messages
7. **Deleted Walk**: Handle requests for deleted walks gracefully

### Migration Strategy

1. **Backward Compatibility**: Existing RequestCard swipe functionality should continue working
2. **Data Migration**: No database changes required
3. **API Updates**: Add new functions but keep existing ones for other features
4. **Gradual Rollout**: Can be deployed without affecting other screens

### Future Enhancements

- Real-time updates for new requests (Supabase subscriptions)
- Request filtering (by event, by date)
- Bulk actions (accept/decline multiple)
- Request notifications
- Request analytics (acceptance rate)

