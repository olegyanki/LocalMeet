# Implementation Plan: Live Tab Bottom Sheet

## Overview

Replace the "+" tab button's default navigation with a bottom sheet overlay containing a minimal "Live" form. Implementation proceeds bottom-up: database migration → API → i18n → components → integration.

## Tasks

- [x] 1. Database migration and type generation
  - [x] 1.1 Create Supabase migration to add `type` column to `walks` table
    - Run `npx supabase migration new add_type_to_walks`
    - Write SQL: `ALTER TABLE walks ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'event' CHECK (type IN ('event', 'live'));`
    - Add index: `CREATE INDEX IF NOT EXISTS idx_walks_type ON walks(type);`
    - Apply migration with `npx supabase db push`
    - _Requirements: 5.1_

  - [x] 1.2 Regenerate TypeScript types from database schema
    - Run `npx supabase gen types typescript --local > src/shared/lib/database.types.ts`
    - Verify the `walks` table type now includes `type: string` field
    - _Requirements: 5.1_

  - [x] 1.3 Update `Walk` interface in `src/shared/lib/api.ts`
    - Add `type?: 'event' | 'live'` to the `Walk` interface
    - _Requirements: 5.1_

- [x] 2. API function and i18n translations
  - [x] 2.1 Implement `createLiveWalk` function in `src/shared/lib/api.ts`
    - Define `CreateLiveWalkParams` interface with `userId`, `latitude`, `longitude`, `statusText`
    - Implement function that inserts into `walks` with `type: 'live'`, `start_time: new Date().toISOString()`, `duration: 7200`, `title: statusText`
    - Return the created `Walk` object
    - Follow existing `createWalk` pattern for error handling
    - _Requirements: 5.1_

  - [ ]* 2.2 Write property test for `createLiveWalk` API call arguments
    - **Property 9: Publish calls API with correct arguments**
    - **Validates: Requirements 5.1**

  - [x] 2.3 Add i18n translations to `src/shared/i18n/locales/uk.json`
    - Add keys: `liveTitle`, `liveSubtitle`, `livePlaceholder`, `livePublishButton`, `liveSecondaryText`, `liveSecondaryButton`, `livePublishError`
    - Use Ukrainian values from design document
    - _Requirements: 7.1, 7.2_

  - [x] 2.4 Add i18n translations to `src/shared/i18n/locales/en.json`
    - Add same 7 keys with English values from design document
    - _Requirements: 7.1, 7.3_

  - [ ]* 2.5 Write property test for locale completeness
    - **Property 15: Both locales contain all required live keys**
    - **Validates: Requirements 7.2, 7.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement PlusTabButton component
  - [x] 4.1 Create `src/features/live/components/PlusTabButton.tsx`
    - Accept standard `tabBarButton` props and an `onPress` override
    - Render the same `Plus` icon and label as the original tab button
    - Call `onPress` prop instead of default tab navigation on press
    - Use `COLORS.ACCENT_ORANGE` for active state, `COLORS.TEXT_LIGHT` for inactive
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 4.2 Write property test for PlusTabButton press behavior
    - **Property 1: Plus button press does not change active tab**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 4.3 Write property test for sheet visibility on press
    - **Property 2: Plus button press makes the sheet visible**
    - **Validates: Requirements 1.2**

- [x] 5. Implement LiveScreen component
  - [x] 5.1 Create `src/features/live/components/LiveScreen.tsx`
    - Accept `onClose` and `onNavigateToCreateEvent` props
    - Render title (`liveTitle`), subtitle (`liveSubtitle`), multiline `TextInput` with placeholder (`livePlaceholder`)
    - Render `PrimaryButton` with title (`livePublishButton`)
    - Render secondary action row: text (`liveSecondaryText`) + link button (`liveSecondaryButton`)
    - Use `COLORS.BG_SECONDARY` background, `COLORS.CARD_BG` for input, `COLORS.ACCENT_ORANGE` for primary actions
    - Apply `paddingBottom: insets.bottom + 16` via `useSafeAreaInsets`
    - Wrap in `ScrollView` with `keyboardShouldPersistTaps="handled"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 5.2 Implement publish logic in LiveScreen
    - Get user location via `expo-location`
    - On publish press: set `isSubmitting=true`, call `createLiveWalk`, on success call `onClose`
    - On failure: set `error` to `t('livePublishError')`, keep sheet open, re-enable button
    - Empty `statusText` is allowed — button stays enabled
    - Show inline error with `COLORS.ERROR_RED` / `COLORS.ERROR_BG` styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 5.3 Implement secondary action in LiveScreen
    - On secondary button press: call `onClose`, then `onNavigateToCreateEvent`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 5.4 Write property test for LiveScreen translated strings
    - **Property 6: Live screen renders all translated strings**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 5.5 Write property test for safe area bottom padding
    - **Property 7: Safe area bottom padding invariant**
    - **Validates: Requirements 3.7**

  - [ ]* 5.6 Write property test for loading state disabling button
    - **Property 11: Loading state disables the button**
    - **Validates: Requirements 5.3**

  - [ ]* 5.7 Write property test for empty text not disabling publish
    - **Property 13: Empty status text does not disable publish button**
    - **Validates: Requirements 5.5**

  - [ ]* 5.8 Write property test for API failure showing error without closing
    - **Property 12: API failure shows error without closing**
    - **Validates: Requirements 5.4**

  - [ ]* 5.9 Write property test for successful publish closing sheet
    - **Property 10: Successful publish closes the sheet**
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement LiveBottomSheet component
  - [x] 7.1 Create `src/features/live/components/LiveBottomSheet.tsx`
    - Accept `isVisible`, `onClose`, `onNavigateToCreateEvent` props
    - Use `Modal` with `transparent` and `visible={isVisible}` for overlay layer and Android back button
    - Render overlay `TouchableOpacity` with `rgba(0,0,0,0.5)` — tap closes sheet
    - Render animated sheet container at 70% screen height with `borderTopLeftRadius: 24`, `borderTopRightRadius: 24`
    - Apply `SHADOW.modal` shadow
    - Render drag handle: 40×4px, `COLORS.GRAY_HANDLE`, centered at top
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

  - [x] 7.2 Implement open/close animations in LiveBottomSheet
    - Open: `Animated.spring` with `tension: 80, friction: 10`
    - Close: `Animated.timing` with `duration: 250ms`
    - Use `useNativeDriver: true` for transform animations
    - _Requirements: 2.1, 2.2_

  - [x] 7.3 Implement PanResponder swipe-to-dismiss in LiveBottomSheet
    - Track vertical gesture via `PanResponder`
    - Dismiss if `dy > 80px` at release
    - Otherwise snap back to open position
    - _Requirements: 2.7_

  - [x] 7.4 Add KeyboardAvoidingView inside LiveBottomSheet
    - Use `behavior='padding'` on iOS, `behavior='height'` on Android
    - Ensure PrimaryButton remains visible above keyboard
    - Render `LiveScreen` inside the sheet with autofocus on TextInput
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 2.10_

  - [ ]* 7.5 Write property test for sheet height calculation
    - **Property 3: Sheet height is 70% of screen height**
    - **Validates: Requirements 2.3**

  - [ ]* 7.6 Write property test for swipe threshold dismiss
    - **Property 4: Swipe threshold controls dismiss**
    - **Validates: Requirements 2.7**

  - [ ]* 7.7 Write property test for overlay visibility
    - **Property 5: Overlay visibility matches sheet visibility**
    - **Validates: Requirements 2.9**

  - [ ]* 7.8 Write property test for KeyboardAvoidingView behavior
    - **Property 8: KeyboardAvoidingView behavior is platform-correct**
    - **Validates: Requirements 4.2**

  - [ ]* 7.9 Write property test for sheet not rendered when not visible
    - **Property 16: Sheet is not rendered when not visible**
    - **Validates: Requirements 8.3**

  - [ ]* 7.10 Write property test for secondary button close then navigate
    - **Property 14: Secondary button closes sheet then navigates**
    - **Validates: Requirements 6.1, 6.2**

- [x] 8. Integrate into Tab Layout
  - [x] 8.1 Modify `app/(tabs)/_layout.tsx` to wire everything together
    - Add `useState<boolean>(false)` for `isVisible`
    - Import `PlusTabButton` and `LiveBottomSheet`
    - Replace `create-event` tab's icon/label with `tabBarButton: (props) => <PlusTabButton {...props} onPress={() => setIsVisible(true)} />`
    - Render `<LiveBottomSheet isVisible={isVisible} onClose={() => setIsVisible(false)} onNavigateToCreateEvent={() => router.push('/create-event')} />` as sibling to `<Tabs>`
    - Wrap both in a `<View style={{ flex: 1 }}>` container
    - Ensure `create-event` tab remains in navigator (not removed, `href` not null)
    - _Requirements: 1.1, 1.2, 1.4, 8.1, 8.2, 8.3, 8.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `create-event` tab route is preserved — only the button behavior changes
- All text uses `t('key')` from `useI18n()` — no hardcoded strings
