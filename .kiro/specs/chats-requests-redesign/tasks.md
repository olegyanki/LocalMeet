# Implementation Plan: Chats & Requests Redesign

## Overview

This implementation plan breaks down the chats and requests redesign into discrete coding tasks. The feature introduces a segmented control for tab navigation, redesigns request cards with pending/past states, adds timestamp formatting, and implements request action handling with chat creation.

## Tasks

- [x] 1. Create utility function for relative timestamp formatting
  - Add `formatRelativeTime` function to `src/shared/utils/time.ts`
  - Implement logic for "Xm ago", "Xh ago", "Xd ago" formats
  - Handle edge cases (< 1 minute, very old dates)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 1.1 Write property test for timestamp formatting
  - **Property 14: Timestamp Format Correctness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 2. Create SegmentedControl component
  - [x] 2.1 Create `src/shared/components/SegmentedControl.tsx` with TypeScript interface
    - Define SegmentedControlProps interface (segments, activeIndex, onChange, style)
    - Implement component with TouchableOpacity for each segment
    - Apply styling: container (gray background, 12px radius, 3px padding)
    - Apply active segment styling (white background, shadow, 10px radius)
    - Apply inactive segment styling (transparent background)
    - Set text styling (15px, weight 600, color based on active state)
    - Use flex: 1 for equal segment distribution
    - _Requirements: 1.1, 1.4, 1.5_

  - [ ]* 2.2 Write property test for segmented control visual states
    - **Property 2: Segmented Control Visual States**
    - **Validates: Requirements 1.4, 1.5**

- [x] 3. Add API functions for fetching requests
  - [x] 3.1 Add `getPendingWalkRequests` function to `src/shared/lib/api.ts`
    - Query walk_requests table with status = 'pending'
    - Filter by walk.user_id = userId
    - Join with profiles and walks tables
    - Order by created_at DESC
    - Return WalkRequestWithProfile[]
    - _Requirements: 2.1, 10.1, 10.3_

  - [x] 3.2 Add `getPastWalkRequests` function to `src/shared/lib/api.ts`
    - Query walk_requests table with status IN ('accepted', 'rejected')
    - Filter by walk.user_id = userId
    - Join with profiles and walks tables
    - Order by updated_at DESC
    - Return WalkRequestWithProfile[]
    - _Requirements: 3.1, 10.2, 10.4_

- [x] 4. Create/update RequestCard component
  - [x] 4.1 Create or update `src/features/chats/components/RequestCard.tsx`
    - Define RequestCardProps interface (request, isPast, onReject, onAccept, onSwipeStart, onSwipeEnd, onCardPress)
    - Implement pending request layout (avatar 48px, name, subtitle, event name with icon, timestamp, action buttons)
    - Implement past request layout (avatar 40px with grayscale, status badge, 60% opacity, no buttons)
    - Apply styling for pending cards (white background, 20px radius, 20px padding, shadow)
    - Apply styling for action buttons (Accept: orange with shadow, Decline: gray)
    - Add onPress handler for card navigation to profile
    - Prevent action button taps from triggering card navigation
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 4.2 Write property test for pending request card completeness
    - **Property 3: Pending Request Card Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

  - [ ]* 4.3 Write property test for pending request card styling
    - **Property 4: Pending Request Card Styling**
    - **Validates: Requirements 2.8, 2.9, 7.1, 7.2, 7.3, 7.4**

  - [ ]* 4.4 Write property test for past request card visual treatment
    - **Property 5: Past Request Card Visual Treatment**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

  - [ ]* 4.5 Write property test for action button styling
    - **Property 19: Action Button Styling**
    - **Validates: Requirements 7.5, 7.6, 7.7, 7.8, 7.9**

  - [ ]* 4.6 Write property test for request card navigation
    - **Property 16: Request Card Navigation**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [ ]* 4.7 Write property test for action button event isolation
    - **Property 17: Action Button Event Isolation**
    - **Validates: Requirements 9.4**

- [x] 5. Implement swipe gestures for pending request cards
  - [x] 5.1 Add PanResponder to RequestCard for swipe detection
    - Implement swipe right (>30% screen width) for accept
    - Implement swipe left (>30% screen width) for decline
    - Add background colors (green for accept, red for decline)
    - Add icons (Check and X, 28px, white, strokeWidth 3)
    - Add spring animation for return, timing animation for dismiss (250ms)
    - Only enable for pending requests (not past)
    - Call onSwipeStart and onSwipeEnd callbacks
    - _Requirements: 4.1, 4.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Redesign ChatsListScreen with tabs and sections
  - [x] 7.1 Update `src/features/chats/screens/ChatsListScreen.tsx` state management
    - Add activeTab state ('messages' | 'requests')
    - Add pendingRequests state (WalkRequestWithProfile[])
    - Add pastRequests state (WalkRequestWithProfile[])
    - Keep existing chats state
    - Add loading, refreshing, error states
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Replace custom switch with SegmentedControl component
    - Import SegmentedControl from shared components
    - Pass segments: ['Messages', 'Requests']
    - Pass activeIndex based on activeTab state
    - Implement onChange handler to update activeTab
    - Position below screen title with proper margins (24px horizontal, 16px bottom)
    - _Requirements: 1.1, 1.4, 1.5_

  - [ ]* 7.3 Write property test for tab switching updates content
    - **Property 1: Tab Switching Updates Content**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 7.4 Implement Requests tab content with sections
    - Create ScrollView for requests tab
    - Add "Pending Requests" section header (18px, weight 600, 24px horizontal padding)
    - Add FlatList for pending requests with RequestCard components
    - Add "Past Requests" section header below pending section
    - Add FlatList for past requests with RequestCard components (isPast=true)
    - Conditionally render sections based on data availability
    - _Requirements: 2.1, 3.1_

  - [ ]* 7.5 Write property test for request sections display conditionally
    - **Property 6: Request Sections Display Conditionally**
    - **Validates: Requirements 2.1, 3.1**

  - [x] 7.6 Implement data loading on mount
    - Add useEffect to fetch pending and past requests on mount
    - Call getPendingWalkRequests and getPastWalkRequests
    - Update state with fetched data
    - Handle loading and error states
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ]* 7.7 Write property test for loading state display
    - **Property 12: Loading State Display**
    - **Validates: Requirements 6.1, 6.3, 6.4, 6.5**

  - [x] 7.8 Implement empty states for both tabs
    - Add "No requests yet" message for empty requests tab (centered, light gray)
    - Add "No chats yet" message for empty messages tab (centered, light gray)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.9 Write property test for empty state styling
    - **Property 11: Empty State Styling**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 7.10 Implement pull-to-refresh for both tabs
    - Add RefreshControl to ScrollView/FlatList
    - Implement onRefresh handler that reloads current tab's data
    - Update refreshing state during reload
    - _Requirements: 6.2_

  - [ ]* 7.11 Write property test for pull-to-refresh behavior
    - **Property 13: Pull-to-Refresh Behavior**
    - **Validates: Requirements 6.2**

- [x] 8. Implement request action handlers
  - [x] 8.1 Add handleAccept function to ChatsListScreen
    - Call API to update request status to 'accepted'
    - Call createChatFromRequest to create chat
    - Navigate to newly created chat using router.push
    - Move request from pending to past requests in state
    - Handle errors with user-friendly error messages
    - Update UI without manual refresh
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.8_

  - [ ]* 8.2 Write property test for accept action effects
    - **Property 7: Accept Action Effects**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 8.3 Add handleDecline function to ChatsListScreen
    - Call API to update request status to 'rejected'
    - Move request from pending to past requests in state
    - Handle errors with user-friendly error messages
    - Update UI without manual refresh
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.4 Write property test for decline action effects
    - **Property 8: Decline Action Effects**
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 8.5 Write property test for request action error handling
    - **Property 9: Request Action Error Handling**
    - **Validates: Requirements 4.7**

  - [ ]* 8.6 Write property test for UI updates without manual refresh
    - **Property 10: UI Updates Without Manual Refresh**
    - **Validates: Requirements 4.8**

  - [x] 8.7 Pass action handlers to RequestCard components
    - Pass handleAccept as onAccept prop
    - Pass handleDecline as onReject prop
    - Pass handleProfileNavigation as onCardPress prop
    - _Requirements: 4.1, 4.5, 9.1, 9.2_

- [x] 9. Implement request sorting
  - [x] 9.1 Add sorting logic for pending requests
    - Sort by created_at in descending order (newest first)
    - Use useMemo for performance
    - _Requirements: 10.1, 10.3_

  - [x] 9.2 Add sorting logic for past requests
    - Sort by updated_at in descending order (most recently processed first)
    - Use useMemo for performance
    - _Requirements: 10.2, 10.4_

  - [ ]* 9.3 Write property test for request sorting order
    - **Property 18: Request Sorting Order**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 10. Add timestamp updates on refresh
  - [x] 10.1 Ensure timestamps recalculate on screen refresh
    - Verify formatRelativeTime is called during render (not cached)
    - Test that pulling to refresh updates timestamps
    - _Requirements: 8.5_

  - [ ]* 10.2 Write property test for timestamp updates on refresh
    - **Property 15: Timestamp Updates on Refresh**
    - **Validates: Requirements 8.5**

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The SegmentedControl component is reusable and should be added to the shared components documentation
- Request sorting uses useMemo for performance optimization
- Error handling should display user-friendly messages, not technical errors
- All timestamps are calculated relative to current time and update on refresh
