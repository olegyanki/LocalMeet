# Implementation Plan: EventCard Redesign

## Overview

This plan transforms the EventCard component from a vertical layout to a modern horizontal layout with enhanced interactivity. The implementation follows an incremental approach: update constants, restructure the layout, add new interactive elements, implement animations, and ensure proper testing.

## Tasks

- [x] 1. Update design constants and add new style definitions
  - Add new constants to `src/shared/constants/styles.ts` (CARD_STYLES, EVENT_IMAGE_SIZE, HOST_AVATAR_SIZE, ONLINE_INDICATOR_SIZE)
  - Add new color constants to `src/shared/constants/colors.ts` (SUBTEXT_LIGHT, SUBTEXT_DARK, TIME_BADGE_BG, TIME_BADGE_TEXT, ONLINE_INDICATOR) if not present
  - Update SHADOW constants to include shadow-2xl equivalent
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 2. Update EventCard props interface
  - [x] 2.1 Add new props to EventCardProps interface
    - Add onFavoritePress optional callback
    - Add onJoinPress optional callback
    - Add isFavorited optional boolean prop
    - _Requirements: 11.5, 11.6, 11.9_
  
  - [ ]* 2.2 Write unit tests for props interface
    - Test component renders with all props
    - Test component renders with minimal props
    - Test optional props are truly optional
    - _Requirements: 11.1-11.9_

- [x] 3. Implement drag handle and card container
  - [x] 3.1 Add drag handle at top of card
    - Create drag handle View with 12px width, 1.5px height
    - Center align and add 12px bottom margin
    - Use COLORS.GRAY_HANDLE for background
    - _Requirements: 1.1_
  
  - [x] 3.2 Update card container styles
    - Apply 48px border radius (3xl)
    - Add 16px padding
    - Add 1px border with COLORS.BORDER_COLOR
    - Apply shadow-2xl effect
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 4. Implement horizontal layout with event image
  - [x] 4.1 Create horizontal content container
    - Use flexDirection: 'row' for horizontal layout
    - Add gap between image and content
    - _Requirements: 1.2_
  
  - [x] 4.2 Implement event image display
    - Create 96x96px image container with 32px border radius
    - Display event image_url or placeholder
    - Add shadow-md and 1px border
    - Handle image load errors with fallback
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 4.3 Write property test for image fallback
    - **Property 5: Image display fallback**
    - **Validates: Requirements 2.2**

- [x] 5. Implement title row with favorite button
  - [x] 5.1 Create title and favorite button row
    - Display event title at 20px, bold, truncated to 1 line
    - Add favorite button (favorite_border icon) aligned right
    - Implement favorite state toggle
    - Prevent favorite button from triggering card press
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.2 Add favorite button animation
    - Implement scale animation on favorite toggle
    - Use Animated.Value and useNativeDriver
    - Animate from 1.0 to 1.2 and back to 1.0
    - _Requirements: 10.4_
  
  - [ ]* 5.3 Write property test for favorite button
    - **Property 2: Favorite button prevents event propagation**
    - **Validates: Requirements 3.5**
  
  - [ ]* 5.4 Write unit tests for favorite button
    - Test favorite icon changes on toggle
    - Test animation triggers on press
    - Test onFavoritePress callback is invoked
    - _Requirements: 3.3, 3.4_

- [x] 6. Implement event description
  - [x] 6.1 Add description text with line clamping
    - Display description at 14px font size
    - Limit to 3 lines maximum (numberOfLines={3})
    - Use COLORS.SUBTEXT_LIGHT/SUBTEXT_DARK
    - Conditionally render only if description exists
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 6.2 Write property test for description truncation
    - **Property 6: Description line clamping**
    - **Validates: Requirements 4.2**

- [x] 7. Implement location and time information row
  - [x] 7.1 Create location info with icon
    - Add location_on icon (Material Icons)
    - Display distance at 14px, medium weight
    - Show "Your Event" for own events instead of distance
    - _Requirements: 5.1, 5.5_
  
  - [x] 7.2 Create time badge with blue dot
    - Calculate time range from start_time and duration
    - Format as "HH:MM - HH:MM"
    - Display in rounded pill badge with blue dot indicator
    - Use 12px font size, semibold weight
    - _Requirements: 5.2, 5.3_
  
  - [x] 7.3 Arrange location and time with space-between
    - Use flexDirection: 'row' with justifyContent: 'space-between'
    - _Requirements: 5.4_
  
  - [ ]* 7.4 Write property test for time formatting
    - **Property 10: Time formatting consistency**
    - **Validates: Requirements 5.3**
  
  - [ ]* 7.5 Write property test for ownership UI
    - **Property 1: Event ownership determines UI elements**
    - **Validates: Requirements 5.5, 8.6**

- [x] 8. Implement content divider
  - Add horizontal divider line (1px height)
  - Use COLORS.GRAY_DIVIDER or COLORS.BORDER_COLOR
  - Add appropriate vertical margins
  - _Requirements: 6.1, 6.2_

- [x] 9. Implement host information footer
  - [x] 9.1 Create host avatar with online indicator
    - Display host avatar at 40x40px size
    - Add green online indicator (12px) when host is online
    - Make avatar pressable with onAvatarPress callback
    - Prevent avatar press from triggering card press
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [x] 9.2 Add host name and label
    - Display "Hosted by" label at 12px
    - Display host name at 14px, bold
    - Handle missing profile data gracefully
    - _Requirements: 7.3, 7.4_
  
  - [ ]* 9.3 Write property test for avatar press
    - **Property 3: Avatar press prevents event propagation**
    - **Validates: Requirements 7.6**
  
  - [ ]* 9.4 Write property test for online indicator
    - **Property 7: Online indicator visibility**
    - **Validates: Requirements 7.2**

- [x] 10. Implement Join button
  - [x] 10.1 Create Join button in footer
    - Display "Join" button aligned right in footer
    - Style with primary orange background, rounded-xl
    - Apply shadow effect
    - Hide button for own events
    - Prevent button press from triggering card press
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 10.2 Write property test for join button
    - **Property 4: Join button prevents event propagation**
    - **Validates: Requirements 8.5**
  
  - [ ]* 10.3 Write unit tests for join button
    - Test button is hidden for own events
    - Test onJoinPress callback is invoked
    - Test button has proper styling
    - _Requirements: 8.1, 8.2, 8.6_

- [x] 11. Implement dark mode support
  - [x] 11.1 Add dark mode color handling
    - Use useColorScheme hook to detect theme
    - Apply card-dark background in dark mode
    - Use gray-800 for borders and dividers in dark mode
    - Update text colors for dark mode readability
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 11.2 Write property test for dark mode
    - **Property 9: Dark mode color adaptation**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 12. Add accessibility and interaction improvements
  - [x] 12.1 Add accessibility labels
    - Add accessibilityLabel to card Pressable
    - Add accessibilityLabel to favorite button
    - Add accessibilityLabel to avatar
    - Add accessibilityLabel to join button
    - Add accessibilityRole to all interactive elements
    - _Requirements: 10.3_
  
  - [x] 12.2 Ensure minimum touch targets
    - Verify all interactive elements are at least 44x44px
    - Add hitSlop if needed for smaller visual elements
    - _Requirements: 10.2_
  
  - [x] 12.3 Add press feedback
    - Add opacity change or scale animation on card press
    - Use Pressable's style function for dynamic feedback
    - _Requirements: 10.1_
  
  - [ ]* 12.4 Write property test for touch targets
    - **Property 8: Touch target minimum size**
    - **Validates: Requirements 10.2**

- [x] 13. Add performance optimizations
  - Wrap component with React.memo
  - Implement custom comparison function for memo
  - Ensure all animations use useNativeDriver: true
  - Add image caching hints
  - _Requirements: All (performance)_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Update component usage in SearchScreen and ProfileScreen
  - [x] 15.1 Update SearchScreen to pass new props
    - Add onFavoritePress handler
    - Add onJoinPress handler
    - Add isFavorited prop (from state or API)
    - _Requirements: 11.5, 11.6, 11.9_
  
  - [x] 15.2 Update ProfileScreen to pass new props
    - Add onFavoritePress handler
    - Add onJoinPress handler
    - Add isFavorited prop (from state or API)
    - _Requirements: 11.5, 11.6, 11.9_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The component remains in `src/shared/components/EventCard.tsx`
- Use existing constants from `@shared/constants` where possible
- Follow design system guidelines from `.kiro/steering/design-system.md`
- Maintain backward compatibility with existing usage
