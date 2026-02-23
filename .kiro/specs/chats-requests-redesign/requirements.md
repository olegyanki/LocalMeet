# Requirements Document

## Introduction

This document specifies the requirements for redesigning the Chats screen with an enhanced focus on the Requests tab. The redesign introduces a segmented control to switch between "Messages" and "Requests" tabs, and implements a new visual design for displaying walk requests with pending and past request sections.

## Glossary

- **ChatsListScreen**: The main screen component that displays both messages and requests
- **Segmented_Control**: A UI component that allows users to switch between "Messages" and "Requests" tabs
- **Request_Card**: A card component displaying a walk request with user information, event details, and action buttons
- **Pending_Request**: A walk request with status "pending" awaiting host response
- **Past_Request**: A walk request with status "accepted" or "rejected" that has been processed
- **Walk_Request**: A database record representing a user's request to join an event
- **Host**: The user who created the event and receives join requests
- **Requester**: The user who sends a request to join an event

## Requirements

### Requirement 1: Segmented Control Navigation

**User Story:** As a user, I want to switch between Messages and Requests tabs using a segmented control, so that I can easily navigate between my chats and incoming requests.

#### Acceptance Criteria

1. THE ChatsListScreen SHALL display a segmented control with two options: "Messages" and "Requests"
2. WHEN a user taps the "Messages" segment, THE ChatsListScreen SHALL display the messages list
3. WHEN a user taps the "Requests" segment, THE ChatsListScreen SHALL display the requests list
4. THE Segmented_Control SHALL visually indicate the active tab with a white background and shadow
5. THE Segmented_Control SHALL display inactive tabs with a light gray background and no shadow

### Requirement 2: Pending Requests Display

**User Story:** As an event host, I want to see all pending join requests in a dedicated section, so that I can review and respond to users who want to join my events.

#### Acceptance Criteria

1. WHEN the Requests tab is active AND pending requests exist, THE ChatsListScreen SHALL display a "Pending Requests" section
2. FOR EACH pending request, THE Request_Card SHALL display the requester's avatar at 48px diameter
3. FOR EACH pending request, THE Request_Card SHALL display the requester's display name in bold text
4. FOR EACH pending request, THE Request_Card SHALL display the text "Wants to join your event"
5. FOR EACH pending request, THE Request_Card SHALL display the event name with an icon
6. FOR EACH pending request, THE Request_Card SHALL display a relative timestamp (e.g., "2m ago", "15m ago", "2h ago")
7. FOR EACH pending request, THE Request_Card SHALL display "Decline" and "Accept" action buttons
8. THE Request_Card SHALL use white background with rounded corners (20px border radius)
9. THE Request_Card SHALL display a subtle shadow for elevation

### Requirement 3: Past Requests Display

**User Story:** As an event host, I want to see my past request decisions in a separate section, so that I can review which requests I've accepted or rejected.

#### Acceptance Criteria

1. WHEN the Requests tab is active AND past requests exist, THE ChatsListScreen SHALL display a "Past Requests" section below pending requests
2. FOR EACH past request, THE Request_Card SHALL display the requester's avatar at 40px diameter
3. FOR EACH past request, THE Request_Card SHALL display the requester's display name
4. FOR EACH past request, THE Request_Card SHALL display status text indicating the decision (e.g., "Accepted for 'Event Name'", "Rejected for 'Event Name'")
5. FOR EACH accepted request, THE Request_Card SHALL display a "Joined" badge with green background
6. FOR EACH rejected request, THE Request_Card SHALL display a "Declined" badge with gray background
7. FOR EACH past request, THE Request_Card SHALL apply 60% opacity to the entire card
8. FOR EACH past request, THE Request_Card SHALL apply grayscale filter to the avatar
9. THE Past_Request cards SHALL NOT display action buttons

### Requirement 4: Request Action Handling

**User Story:** As an event host, I want to accept or decline join requests, so that I can control who participates in my events.

#### Acceptance Criteria

1. WHEN a user taps the "Accept" button on a pending request, THE ChatsListScreen SHALL update the request status to "accepted"
2. WHEN a user taps the "Accept" button, THE ChatsListScreen SHALL create a chat between the host and requester
3. WHEN a user taps the "Accept" button, THE ChatsListScreen SHALL navigate to the newly created chat
4. WHEN a user taps the "Accept" button, THE ChatsListScreen SHALL move the request from pending to past requests section
5. WHEN a user taps the "Decline" button on a pending request, THE ChatsListScreen SHALL update the request status to "rejected"
6. WHEN a user taps the "Decline" button, THE ChatsListScreen SHALL move the request from pending to past requests section
7. IF a request action fails, THEN THE ChatsListScreen SHALL display an error message to the user
8. WHEN a request is accepted or declined, THE ChatsListScreen SHALL update the UI without requiring a manual refresh

### Requirement 5: Empty States

**User Story:** As a user, I want to see helpful messages when there are no requests or messages, so that I understand the current state of the screen.

#### Acceptance Criteria

1. WHEN the Requests tab is active AND no pending or past requests exist, THE ChatsListScreen SHALL display "No requests yet" message
2. WHEN the Messages tab is active AND no chats exist, THE ChatsListScreen SHALL display "No chats yet" message
3. THE empty state messages SHALL be centered vertically and horizontally
4. THE empty state messages SHALL use light gray text color

### Requirement 6: Loading and Refresh States

**User Story:** As a user, I want to see loading indicators and be able to refresh the content, so that I know when data is being fetched and can manually update the list.

#### Acceptance Criteria

1. WHEN the ChatsListScreen is loading initial data, THE ChatsListScreen SHALL display a loading spinner
2. WHEN a user pulls down to refresh, THE ChatsListScreen SHALL reload the current tab's data
3. WHEN data is being refreshed, THE ChatsListScreen SHALL display a refresh indicator
4. THE loading spinner SHALL use the app's accent orange color
5. WHEN data loading completes, THE ChatsListScreen SHALL hide the loading indicator

### Requirement 7: Request Card Styling

**User Story:** As a user, I want request cards to be visually appealing and easy to read, so that I can quickly understand the request details.

#### Acceptance Criteria

1. THE Request_Card SHALL use white background color (#FFFFFF)
2. THE Request_Card SHALL use 20px border radius for rounded corners
3. THE Request_Card SHALL display a subtle shadow with 0.06 opacity
4. THE Request_Card SHALL use 20px padding on all sides
5. THE "Accept" button SHALL use orange background (#FF7A00) with white text
6. THE "Accept" button SHALL display a shadow for elevation
7. THE "Decline" button SHALL use light gray background with dark text
8. THE action buttons SHALL use 16px border radius
9. THE action buttons SHALL be horizontally aligned with equal spacing

### Requirement 8: Timestamp Formatting

**User Story:** As a user, I want to see relative timestamps for requests, so that I can understand how recent each request is.

#### Acceptance Criteria

1. FOR requests less than 60 minutes old, THE Request_Card SHALL display timestamp in minutes (e.g., "2m ago", "45m ago")
2. FOR requests less than 24 hours old, THE Request_Card SHALL display timestamp in hours (e.g., "2h ago", "12h ago")
3. FOR requests 24 hours or older, THE Request_Card SHALL display timestamp in days (e.g., "2d ago", "5d ago")
4. THE timestamp SHALL be calculated relative to the current time
5. THE timestamp SHALL update when the screen is refreshed

### Requirement 9: User Profile Navigation

**User Story:** As an event host, I want to tap on a requester's card to view their profile, so that I can learn more about them before making a decision.

#### Acceptance Criteria

1. WHEN a user taps on a pending request card, THE ChatsListScreen SHALL navigate to the requester's profile screen
2. WHEN a user taps on a past request card, THE ChatsListScreen SHALL navigate to the requester's profile screen
3. THE navigation SHALL pass the requester's user ID to the profile screen
4. THE action buttons SHALL NOT trigger profile navigation when tapped

### Requirement 10: Request Sorting

**User Story:** As an event host, I want to see the most recent requests first, so that I can prioritize responding to new requests.

#### Acceptance Criteria

1. THE ChatsListScreen SHALL sort pending requests by creation time in descending order (newest first)
2. THE ChatsListScreen SHALL sort past requests by update time in descending order (most recently processed first)
3. WHEN a new request is received, THE ChatsListScreen SHALL display it at the top of the pending requests section
4. WHEN a request is accepted or declined, THE ChatsListScreen SHALL display it at the top of the past requests section
