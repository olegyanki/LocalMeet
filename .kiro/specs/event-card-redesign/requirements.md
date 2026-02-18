# Requirements Document: EventCard Redesign

## Introduction

This document specifies the requirements for redesigning the EventCard component to match the new design system. The redesign transforms the card from a vertical layout to a horizontal layout with improved visual hierarchy, better information density, and enhanced user interaction capabilities.

## Glossary

- **EventCard**: A reusable React Native component that displays event information in a card format
- **NearbyWalk**: Data structure containing event details and distance from user
- **Host**: The user who created the event
- **Favorite**: User action to bookmark/save an event for later
- **Join**: User action to request participation in an event
- **Drag_Handle**: Visual indicator at the top of the card for drag-and-drop interactions
- **Online_Indicator**: Visual badge showing the host's online status

## Requirements

### Requirement 1: Card Layout Structure

**User Story:** As a user, I want to see event information in a clear horizontal layout, so that I can quickly scan multiple events.

#### Acceptance Criteria

1. THE EventCard SHALL display a drag handle at the top of the card (12px width, 1.5px height, centered)
2. THE EventCard SHALL use a horizontal layout with event image on the left (96x96px) and content on the right
3. THE EventCard SHALL have a border radius of 48px (3xl) and 16px padding
4. THE EventCard SHALL include a 1px border with color gray-100 (light mode) or gray-800 (dark mode)
5. THE EventCard SHALL apply shadow-2xl effect for depth

### Requirement 2: Event Image Display

**User Story:** As a user, I want to see the event's cover image, so that I can visually identify events.

#### Acceptance Criteria

1. WHEN an event has an image_url, THE EventCard SHALL display it in a 96x96px container with 32px border radius
2. WHEN an event has no image_url, THE EventCard SHALL display a placeholder image or default background
3. THE EventCard SHALL apply shadow-md to the event image
4. THE EventCard SHALL add a 1px border to the image with color gray-100 (light mode) or gray-700 (dark mode)

### Requirement 3: Event Title and Favorite Button

**User Story:** As a user, I want to see the event title and be able to favorite events, so that I can save interesting events for later.

#### Acceptance Criteria

1. THE EventCard SHALL display the event title at 20px font size, bold weight, truncated to 1 line
2. THE EventCard SHALL display a favorite button (favorite_border icon) aligned to the right of the title
3. WHEN a user taps the favorite button, THE EventCard SHALL toggle the favorite state with animation
4. WHEN an event is favorited, THE EventCard SHALL display a filled favorite icon (favorite icon)
5. THE EventCard SHALL prevent the favorite button tap from triggering the card press event

### Requirement 4: Event Description

**User Story:** As a user, I want to read a brief description of the event, so that I can understand what the event is about.

#### Acceptance Criteria

1. WHEN an event has a description, THE EventCard SHALL display it at 14px font size
2. THE EventCard SHALL limit the description to 3 lines maximum (line-clamp-3)
3. THE EventCard SHALL use subtext color (light mode: subtext-light, dark mode: subtext-dark)

### Requirement 5: Location and Time Information

**User Story:** As a user, I want to see where and when the event takes place, so that I can decide if I can attend.

#### Acceptance Criteria

1. THE EventCard SHALL display distance from user with location_on icon at 14px font size, medium weight
2. THE EventCard SHALL display event time in a rounded pill badge with blue dot indicator
3. THE EventCard SHALL format time as "HH:MM - HH:MM" at 12px font size, semibold weight
4. THE EventCard SHALL arrange location and time in one row with space-between justification
5. WHEN the event is created by the current user, THE EventCard SHALL display "Your Event" instead of distance

### Requirement 6: Content Divider

**User Story:** As a user, I want clear visual separation between event details and host information, so that I can easily distinguish different sections.

#### Acceptance Criteria

1. THE EventCard SHALL display a horizontal divider line (1px height) between content and footer
2. THE EventCard SHALL use gray-100 color (light mode) or gray-800 color (dark mode) for the divider

### Requirement 7: Host Information Footer

**User Story:** As a user, I want to see who is hosting the event, so that I can recognize familiar hosts.

#### Acceptance Criteria

1. THE EventCard SHALL display the host's avatar at 40x40px size in the footer
2. WHEN the host is online, THE EventCard SHALL display a green online indicator on the avatar
3. THE EventCard SHALL display "Hosted by" label at 12px font size above the host's name
4. THE EventCard SHALL display the host's name at 14px font size, bold weight
5. THE EventCard SHALL allow tapping the host avatar to navigate to the host's profile
6. THE EventCard SHALL prevent the avatar tap from triggering the card press event

### Requirement 8: Join Button

**User Story:** As a user, I want to quickly join an event from the card, so that I don't have to open the full event details.

#### Acceptance Criteria

1. THE EventCard SHALL display a "Join" button in the footer aligned to the right
2. THE EventCard SHALL style the Join button with primary orange background and rounded-xl border radius
3. THE EventCard SHALL apply shadow to the Join button
4. WHEN a user taps the Join button, THE EventCard SHALL trigger the join action callback
5. THE EventCard SHALL prevent the Join button tap from triggering the card press event
6. WHEN the event is created by the current user, THE EventCard SHALL hide the Join button

### Requirement 9: Dark Mode Support

**User Story:** As a user, I want the EventCard to adapt to my system theme, so that it's comfortable to view in any lighting condition.

#### Acceptance Criteria

1. WHEN the system is in dark mode, THE EventCard SHALL use card-dark background color
2. WHEN the system is in dark mode, THE EventCard SHALL use appropriate text colors for readability
3. WHEN the system is in dark mode, THE EventCard SHALL use gray-800 for borders and dividers
4. WHEN the system is in light mode, THE EventCard SHALL use card-light background color

### Requirement 10: Interaction and Accessibility

**User Story:** As a user, I want smooth interactions and proper touch targets, so that the card is easy to use.

#### Acceptance Criteria

1. THE EventCard SHALL provide visual feedback when pressed (opacity change or scale animation)
2. THE EventCard SHALL ensure all interactive elements have minimum 44x44px touch targets
3. THE EventCard SHALL support accessibility labels for screen readers
4. WHEN the favorite button is tapped, THE EventCard SHALL animate the icon transition (scale or fade)

### Requirement 11: Component Props Interface

**User Story:** As a developer, I want a clear props interface, so that I can easily integrate the EventCard component.

#### Acceptance Criteria

1. THE EventCard SHALL accept a NearbyWalk item prop containing event data
2. THE EventCard SHALL accept a currentUserId prop to determine ownership
3. THE EventCard SHALL accept an onPress callback for card tap events
4. THE EventCard SHALL accept an onAvatarPress callback for host avatar tap events
5. THE EventCard SHALL accept an onFavoritePress callback for favorite button tap events
6. THE EventCard SHALL accept an onJoinPress callback for join button tap events
7. THE EventCard SHALL accept an optional width prop for custom card width
8. THE EventCard SHALL accept a translation function prop for i18n support
9. THE EventCard SHALL accept an optional isFavorited prop to control favorite state
