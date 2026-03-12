# Requirements Document: Group Chat System

## Introduction

This document specifies requirements for refactoring the chat system from 1-on-1 conversations to group chats for events. The system currently supports only 1-on-1 chats created when walk requests are accepted. The new system will support group chats where all accepted participants of an event can communicate together, while maintaining architectural flexibility for future direct messaging features.

## Glossary

- **Chat_System**: The messaging subsystem that manages conversations between users
- **Group_Chat**: A conversation with multiple participants associated with a specific event
- **Direct_Chat**: A 1-on-1 conversation between two users (future feature, not implemented)
- **Event**: A walk/activity created by a user (stored in `walks` table)
- **Event_Creator**: The user who created an event (owner role in group chat)
- **Participant**: A user who has been accepted to join an event
- **Chat_Participant**: A user who is a member of a chat
- **Walk_Request**: A request from a user to join an event
- **Message**: A text, image, or audio communication sent in a chat
- **RLS_Policy**: Row Level Security policy that controls data access in PostgreSQL
- **Migration**: A database schema change script

## Requirements

### Requirement 1: Group Chat Creation

**User Story:** As an event creator, I want a group chat automatically created when I create an event, so that all accepted participants can communicate together.

#### Acceptance Criteria

1. WHEN an Event is created, THE Chat_System SHALL create a Group_Chat associated with that Event
2. WHEN a Group_Chat is created, THE Chat_System SHALL add the Event_Creator as a Chat_Participant with owner role
3. THE Chat_System SHALL store the chat type as 'group' in the database
4. THE Chat_System SHALL link the Group_Chat to the Event via walk_id foreign key
5. THE Chat_System SHALL complete Group_Chat creation within the same database transaction as Event creation

### Requirement 2: Automatic Participant Addition

**User Story:** As an event creator, I want users automatically added to the group chat when I accept their join request, so that they can immediately start communicating.

#### Acceptance Criteria

1. WHEN a Walk_Request status changes to 'accepted', THE Chat_System SHALL add the requester as a Chat_Participant to the Event's Group_Chat
2. THE Chat_System SHALL assign the 'member' role to newly added Chat_Participants
3. THE Chat_System SHALL complete participant addition within the same database transaction as Walk_Request acceptance
4. THE Chat_System SHALL preserve the existing Group_Chat if it already exists
5. IF the Event has no associated Group_Chat, THEN THE Chat_System SHALL create one before adding the participant

### Requirement 3: Multi-Participant Messaging

**User Story:** As a participant, I want to send messages that all group members can see, so that we can coordinate the event together.

#### Acceptance Criteria

1. WHEN a Chat_Participant sends a Message, THE Chat_System SHALL deliver it to all Chat_Participants in that Group_Chat
2. THE Chat_System SHALL include sender profile information (username, display_name, avatar_url) with each Message
3. THE Chat_System SHALL order Messages by creation timestamp in ascending order
4. THE Chat_System SHALL support text, image, and audio Message types
5. THE Chat_System SHALL enforce that only Chat_Participants can send Messages to a Group_Chat

### Requirement 4: Participant Management

**User Story:** As an event creator, I want to remove disruptive participants from the group chat, so that I can maintain a positive environment.

#### Acceptance Criteria

1. WHEN the Event_Creator removes a Chat_Participant, THE Chat_System SHALL delete that participant's membership record
2. THE Chat_System SHALL prevent removed Chat_Participants from viewing or sending Messages in that Group_Chat
3. THE Chat_System SHALL preserve all Messages sent by removed Chat_Participants
4. THE Chat_System SHALL allow only Chat_Participants with owner role to remove other Chat_Participants
5. THE Chat_System SHALL prevent the Event_Creator from removing themselves while other Chat_Participants exist

### Requirement 5: Voluntary Chat Exit

**User Story:** As a participant, I want to leave a group chat if I can no longer attend the event, so that I stop receiving messages.

#### Acceptance Criteria

1. WHEN a Chat_Participant leaves a Group_Chat, THE Chat_System SHALL delete that participant's membership record
2. THE Chat_System SHALL prevent the departed Chat_Participant from viewing or sending Messages in that Group_Chat
3. THE Chat_System SHALL preserve all Messages sent by the departed Chat_Participant
4. THE Chat_System SHALL allow any Chat_Participant to leave a Group_Chat
5. IF the Event_Creator leaves and other Chat_Participants exist, THEN THE Chat_System SHALL transfer owner role to the earliest joined Chat_Participant

### Requirement 6: Chat Persistence

**User Story:** As a user, I want to access chat history after an event ends, so that I can review conversations and maintain connections.

#### Acceptance Criteria

1. THE Chat_System SHALL preserve Group_Chats after the Event end time has passed
2. THE Chat_System SHALL preserve all Messages in a Group_Chat regardless of Event status
3. WHEN an Event is deleted, THE Chat_System SHALL preserve the associated Group_Chat and Messages
4. THE Chat_System SHALL allow Chat_Participants to view Messages in Group_Chats for Events that have ended
5. THE Chat_System SHALL allow Chat_Participants to continue sending Messages in Group_Chats for Events that have ended

### Requirement 7: Chat List Display

**User Story:** As a user, I want to see all my group chats with the latest message, so that I can quickly find active conversations.

#### Acceptance Criteria

1. THE Chat_System SHALL display all Group_Chats where the user is a Chat_Participant
2. FOR EACH Group_Chat, THE Chat_System SHALL display the Event title and image
3. FOR EACH Group_Chat, THE Chat_System SHALL display the most recent Message content and timestamp
4. FOR EACH Group_Chat, THE Chat_System SHALL display all Chat_Participant avatars
5. THE Chat_System SHALL order Group_Chats by most recent Message timestamp in descending order
6. THE Chat_System SHALL fetch chat list data in a single optimized database query

### Requirement 8: Access Control

**User Story:** As a user, I want my chats to be private, so that only participants can view messages.

#### Acceptance Criteria

1. THE Chat_System SHALL enforce that only Chat_Participants can view a Group_Chat
2. THE Chat_System SHALL enforce that only Chat_Participants can view Messages in a Group_Chat
3. THE Chat_System SHALL enforce that only Chat_Participants can send Messages to a Group_Chat
4. THE Chat_System SHALL use RLS_Policies to enforce access control at the database level
5. THE Chat_System SHALL verify Chat_Participant membership before allowing any chat operation

### Requirement 9: Database Schema Migration

**User Story:** As a developer, I want to migrate existing 1-on-1 chats to the new schema, so that users don't lose their conversation history.

#### Acceptance Criteria

1. THE Migration SHALL create a new `chat_participants` table with columns: id, chat_id, user_id, role, joined_at
2. THE Migration SHALL add a `type` column to the `chats` table with values 'group' or 'direct'
3. THE Migration SHALL add a `walk_id` column to the `chats` table as a nullable foreign key
4. THE Migration SHALL convert existing chats to type 'direct' and create corresponding chat_participants records
5. THE Migration SHALL remove the `requester_id` and `walker_id` columns from the `chats` table after data migration
6. THE Migration SHALL create indexes on chat_participants(chat_id) and chat_participants(user_id)
7. THE Migration SHALL preserve all existing Messages without modification
8. THE Migration SHALL complete without data loss or downtime

### Requirement 10: Future Direct Message Support

**User Story:** As a developer, I want the architecture to support future direct messaging, so that we can add 1-on-1 chats without major refactoring.

#### Acceptance Criteria

1. THE Chat_System SHALL distinguish between Group_Chat and Direct_Chat using the type column
2. THE Chat_System SHALL allow Group_Chats to have a walk_id and Direct_Chats to have null walk_id
3. THE Chat_System SHALL use the same chat_participants table for both Group_Chat and Direct_Chat
4. THE Chat_System SHALL use the same messages table for both Group_Chat and Direct_Chat
5. THE Chat_System SHALL structure RLS_Policies to support both chat types without modification

### Requirement 11: Performance Optimization

**User Story:** As a user, I want the chat list to load quickly, so that I can access my conversations without delay.

#### Acceptance Criteria

1. THE Chat_System SHALL fetch all chat list data (chats, participants, last messages, event info) in a single RPC function call
2. THE Chat_System SHALL use database indexes on chat_participants(user_id) for participant lookups
3. THE Chat_System SHALL use database indexes on messages(chat_id, created_at) for last message queries
4. THE Chat_System SHALL use database indexes on chats(walk_id) for event association lookups
5. FOR N chats, THE Chat_System SHALL execute O(1) database queries, not O(N) queries

### Requirement 12: Real-time Message Delivery

**User Story:** As a participant, I want to see new messages immediately, so that I can have real-time conversations.

#### Acceptance Criteria

1. WHEN a Message is inserted, THE Chat_System SHALL broadcast a real-time notification to all Chat_Participants
2. THE Chat_System SHALL use Supabase real-time subscriptions for Message delivery
3. THE Chat_System SHALL include sender profile information in real-time Message notifications
4. THE Chat_System SHALL deliver Messages to Chat_Participants within 1 second of sending
5. THE Chat_System SHALL handle real-time subscription reconnection after network interruptions

### Requirement 13: Message Read Status

**User Story:** As a user, I want to see which messages I haven't read, so that I don't miss important information.

#### Acceptance Criteria

1. THE Chat_System SHALL mark Messages as unread by default when created
2. WHEN a Chat_Participant views a Group_Chat, THE Chat_System SHALL mark all Messages in that chat as read for that user
3. THE Chat_System SHALL display unread message count for each Group_Chat in the chat list
4. THE Chat_System SHALL exclude the sender from read status tracking for their own Messages
5. THE Chat_System SHALL update read status within 2 seconds of viewing a chat

### Requirement 14: API Function Structure

**User Story:** As a developer, I want clear API functions for chat operations, so that the codebase is maintainable.

#### Acceptance Criteria

1. THE Chat_System SHALL provide a `getMyGroupChats(userId)` function that returns all Group_Chats for a user
2. THE Chat_System SHALL provide a `getGroupChatById(chatId)` function that returns chat details with participants
3. THE Chat_System SHALL provide a `getGroupChatMessages(chatId)` function that returns all Messages for a chat
4. THE Chat_System SHALL provide a `sendGroupMessage(chatId, senderId, content)` function for sending Messages
5. THE Chat_System SHALL provide a `leaveGroupChat(chatId, userId)` function for voluntary exit
6. THE Chat_System SHALL provide a `removeParticipant(chatId, userId, removedUserId)` function for owner-initiated removal
7. THE Chat_System SHALL provide a `addParticipantToGroupChat(chatId, userId)` function for adding Chat_Participants
8. ALL API functions SHALL throw descriptive errors when operations fail

## Non-Functional Requirements

### Performance
- Chat list queries SHALL complete within 500ms for up to 100 chats
- Message queries SHALL complete within 300ms for up to 1000 messages
- Real-time message delivery SHALL have latency under 1 second

### Scalability
- System SHALL support Group_Chats with up to 50 Chat_Participants
- System SHALL support up to 10,000 Messages per Group_Chat
- Database schema SHALL support millions of chats without performance degradation

### Reliability
- Database operations SHALL be atomic (all-or-nothing)
- System SHALL handle concurrent participant additions without race conditions
- System SHALL handle network interruptions gracefully with automatic reconnection

### Security
- All database access SHALL be controlled by RLS_Policies
- Chat_Participants SHALL only access chats they are members of
- Message content SHALL not be accessible to non-participants

### Maintainability
- Code SHALL follow existing project patterns in `@shared/lib/api.ts`
- Database changes SHALL use migration files, not manual SQL
- TypeScript types SHALL be generated from database schema
- All functions SHALL have TypeScript type annotations

## Out of Scope

The following features are explicitly NOT included in this specification:

1. Direct messaging between users (architecture supports it, but not implemented)
2. Message editing or deletion
3. Message reactions or emoji responses
4. Typing indicators
5. Message search functionality
6. File attachments beyond images and audio
7. Chat archiving or muting
8. Push notifications for new messages
9. Message encryption
10. Chat backups or exports

## Migration Strategy

### Phase 1: Schema Changes
1. Create `chat_participants` table
2. Add `type` and `walk_id` columns to `chats` table
3. Create necessary indexes

### Phase 2: Data Migration
1. Convert existing chats to type 'direct'
2. Create chat_participants records for existing chats
3. Validate data integrity

### Phase 3: Code Updates
1. Update API functions to use new schema
2. Update RLS policies for new structure
3. Create RPC functions for optimized queries

### Phase 4: Testing
1. Run exploration tests to verify migration
2. Run preservation tests to ensure existing functionality works
3. Test new group chat features

### Phase 5: Cleanup
1. Remove deprecated columns (`requester_id`, `walker_id`)
2. Remove old API functions
3. Update TypeScript types

## Success Criteria

The implementation will be considered successful when:

1. All acceptance criteria pass their tests
2. Existing 1-on-1 chats are preserved and functional
3. New group chats are created for events
4. Participants can send and receive messages in group chats
5. Chat list loads in under 500ms
6. No data loss during migration
7. All TypeScript types are up to date
8. All tests pass (exploration and preservation)

## Dependencies

- Supabase PostgreSQL database
- Supabase real-time subscriptions
- Existing `walks`, `walk_requests`, `profiles` tables
- Existing `@shared/lib/api.ts` API layer
- Existing authentication system (AuthContext)

## References

- Current chat implementation: `src/shared/lib/api.ts`
- Current database schema: `supabase/migrations/20251205165411_019_create_chats_and_messages_tables.sql`
- Walk requests schema: `supabase/migrations/20251205154809_018_create_walk_requests_table.sql`
- Database workflow: `.kiro/steering/database-workflow.md`
- Testing workflow: `.kiro/steering/database-testing.md`
