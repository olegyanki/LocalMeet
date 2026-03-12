# Tasks: Group Chat System

## Overview

This document outlines the implementation tasks for refactoring the chat system from 1-on-1 conversations to group chats for events. Tasks are organized by implementation phase and include database migrations, API updates, UI changes, and comprehensive testing.

## Task List

### Phase 1: Database Schema Migration

- [x] 1. Create database migration file
  - [x] 1.1 Create migration: `supabase/migrations/TIMESTAMP_group_chat_system.sql`
  - [x] 1.2 Add chat_participants table with indexes
  - [x] 1.3 Add type and walk_id columns to chats table
  - [x] 1.4 Create indexes for new columns

- [x] 2. Migrate existing data
  - [x] 2.1 Set type='direct' for all existing chats
  - [x] 2.2 Create chat_participants records from requester_id/walker_id
  - [x] 2.3 Verify data integrity with validation queries
  - [x] 2.4 Make type column NOT NULL after migration

### Phase 2: Database Triggers and Functions

- [x] 3. Create database triggers
  - [x] 3.1 Create trigger function: create_group_chat_on_walk_insert()
  - [x] 3.2 Create trigger: create_group_chat_on_walk_insert_trigger
  - [x] 3.3 Create trigger function: add_participant_on_request_accept()
  - [x] 3.4 Create trigger: add_participant_on_request_accept_trigger
  - [x] 3.5 Create trigger function: transfer_ownership_on_creator_leave()
  - [x] 3.6 Create trigger: transfer_ownership_on_creator_leave_trigger

- [x] 4. Create RPC functions
  - [x] 4.1 Create RPC: get_my_chats_optimized(p_user_id)
  - [x] 4.2 Create RPC: get_chat_details(p_chat_id, p_user_id)
  - [x] 4.3 Test RPC functions with sample data

### Phase 3: Row Level Security Policies

- [x] 5. Update RLS policies for chats table
  - [x] 5.1 Drop old policies (viewable by participants, users can create, participants can delete)
  - [x] 5.2 Create policy: "Users can view their chats"
  - [x] 5.3 Create policy: "System can create chats"

- [x] 6. Create RLS policies for chat_participants table
  - [x] 6.1 Enable RLS on chat_participants
  - [x] 6.2 Create policy: "Users can view participants of their chats"
  - [x] 6.3 Create policy: "System can insert participants"
  - [x] 6.4 Create policy: "Users can leave chats"
  - [x] 6.5 Create policy: "Owners can remove participants"

- [x] 7. Update RLS policies for messages table
  - [x] 7.1 Drop old policies
  - [x] 7.2 Create policy: "Users can view messages in their chats"
  - [x] 7.3 Create policy: "Participants can send messages"
  - [x] 7.4 Create policy: "Users can mark messages as read"

### Phase 4: TypeScript Types and API Layer

- [x] 8. Generate TypeScript types
  - [x] 8.1 Run: `npx supabase gen types typescript --local > src/shared/lib/database.types.ts`
  - [x] 8.2 Verify types include chat_participants table
  - [x] 8.3 Verify types include new columns (type, walk_id)

- [x] 9. Create new TypeScript interfaces
  - [x] 9.1 Add Chat interface to api.ts
  - [x] 9.2 Add ChatParticipant interface to api.ts
  - [x] 9.3 Add ChatWithDetails interface to api.ts
  - [x] 9.4 Update Message interface with sender profile

- [x] 10. Implement new API functions
  - [x] 10.1 Implement getMyChats(userId) - works for both group and direct
  - [x] 10.2 Implement getChatMessages(chatId) - works for both group and direct
  - [x] 10.3 Implement sendMessage(chatId, senderId, content, ...) - works for both group and direct
  - [x] 10.4 Implement leaveChat(chatId, userId) - works for both group and direct
  - [x] 10.5 Implement removeChatParticipant(chatId, removedUserId) - typically for group chats
  - [x] 10.6 Implement markChatAsRead(chatId, userId) - works for both group and direct

- [x] 11. Update existing API functions
  - [x] 11.1 Mark old chat functions as deprecated
  - [x] 11.2 Update createWalk to verify group chat creation
  - [x] 11.3 Update updateWalkRequestStatus to verify participant addition

### Phase 5: UI Component Updates

- [x] 12. Update ChatsListScreen
  - [x] 12.1 Update to use new getMyChats (returns both group and direct chats)
  - [x] 12.2 Update UI to show multiple participant avatars
  - [x] 12.3 Update UI to show event title and image (for group chats)
  - [x] 12.4 Add unread count badge display
  - [x] 12.5 Update real-time subscription for new schema

- [x] 13. Update ChatScreen
  - [x] 13.1 Update to use getChatMessages (works for both types)
  - [x] 13.2 Update to use sendMessage (works for both types)
  - [x] 13.3 Add participant list display
  - [x] 13.4 Add "Leave Chat" button
  - [x] 13.5 Add "Remove Participant" button (owner only, for group chats)
  - [x] 13.6 Update real-time subscription for new schema

- [x] 14. Update EventDetailsScreen
  - [x] 14.1 Add "Open Group Chat" button
  - [x] 14.2 Navigate to group chat when button pressed
  - [x] 14.3 Show participant count

### Phase 6: Property-Based Tests

- [x] 15. Write Group Chat Creation property tests
  - [x] 15.1 Property 1: Event creation triggers group chat creation
  - [x] 15.2 Property 2: Event creator becomes chat owner
  - [x] 15.3 Property 3: Group chat creation is atomic with event creation

- [x] 16. Write Participant Management property tests
  - [x] 16.1 Property 4: Accepted requests add participants
  - [x] 16.2 Property 5: Participant addition is atomic with request acceptance
  - [x] 16.3 Property 6: One group chat per event
  - [x] 16.4 Property 7: Owner removal transfers ownership
  - [x] 16.5 Property 8: Departed participants lose access
  - [x] 16.6 Property 9: Historical messages are preserved
  - [x] 16.7 Property 10: Only owners can remove participants
  - [x] 16.8 Property 11: Owner cannot abandon chat
  - [x] 16.9 Property 12: Any participant can leave

- [x] 17. Write Messaging property tests
  - [x] 17.1 Property 13: Messages are visible to all participants
  - [x] 17.2 Property 14: Messages include sender profile
  - [x] 17.3 Property 15: Messages are chronologically ordered
  - [x] 17.4 Property 16: All message types are supported
  - [x] 17.5 Property 17: Only participants can send messages
  - [x] 17.6 Property 18: Messages default to unread
  - [x] 17.7 Property 19: Mark as read updates all unread messages
  - [x] 17.8 Property 20: Unread count excludes sender's messages

- [x] 18. Write Access Control property tests
  - [x] 18.1 Property 21: Only participants can view chats
  - [x] 18.2 Property 22: Only participants can view messages

- [x] 19. Write Chat Persistence property tests
  - [x] 19.1 Property 23: Chats persist after events end
  - [x] 19.2 Property 24: Chats persist after event deletion
  - [x] 19.3 Property 25: Participants can access ended event chats

- [x] 20. Write Chat List property tests
  - [x] 20.1 Property 26: Chat list includes all user's chats
  - [x] 20.2 Property 27: Chat list includes event details
  - [x] 20.3 Property 28: Chat list includes last message
  - [x] 20.4 Property 29: Chat list includes participant avatars
  - [x] 20.5 Property 30: Chat list is ordered by recency
  - [x] 20.6 Property 31: Chat list uses single query
  - [x] 20.7 Property 32: Chat list includes unread count

- [x] 21. Write Migration property tests
  - [x] 21.1 Property 33: Existing chats become direct type
  - [x] 21.2 Property 34: Existing chats have two participants
  - [x] 21.3 Property 35: Messages are preserved during migration
  - [x] 21.4 Property 36: No data loss during migration

- [x] 22. Write Architecture property tests
  - [x] 22.1 Property 37: Group chats have walk_id, direct chats don't
  - [x] 22.2 Property 38: API functions throw descriptive errors

### Phase 7: Integration Tests

- [x] 23. Write integration tests
  - [x] 23.1 Test: Create event → group chat created → creator is owner
  - [x] 23.2 Test: Accept request → participant added → can send messages
  - [x] 23.3 Test: Send message → all participants receive via real-time
  - [x] 23.4 Test: Owner leaves → ownership transferred → new owner can remove
  - [x] 23.5 Test: Participant leaves → cannot access chat → messages preserved

### Phase 8: Internationalization

- [x] 24. Add translations
  - [x] 24.1 Add Ukrainian translations for group chat UI
  - [x] 24.2 Add English translations for group chat UI
  - [x] 24.3 Add error messages for chat operations

### Phase 9: Cleanup and Documentation

- [x] 25. Remove deprecated code
  - [x] 25.1 Remove requester_id and walker_id columns from chats table
  - [x] 25.2 Remove walk_request_id column from chats table
  - [x] 25.3 Drop old indexes (chats_requester_id_idx, chats_walker_id_idx)
  - [x] 25.4 Remove deprecated API functions (createChatFromRequest, getChatById)

- [x] 26. Update documentation
  - [x] 26.1 Update project-context.md with new chat system architecture
  - [x] 26.2 Update database-workflow.md with migration example
  - [x] 26.3 Add group chat usage examples to README

### Phase 10: Testing and Verification

- [x] 27. Run all tests
  - [x] 27.1 Run property-based tests: `npm test -- group-chat`
  - [x] 27.2 Run integration tests: `npm test -- integration`
  - [x] 27.3 Verify all tests pass

- [x] 28. Manual testing
  - [x] 28.1 Test: Create event and verify group chat appears
  - [x] 28.2 Test: Accept walk request and verify participant added
  - [x] 28.3 Test: Send messages in group chat
  - [x] 28.4 Test: Leave group chat
  - [x] 28.5 Test: Remove participant (as owner)
  - [x] 28.6 Test: Real-time message delivery
  - [x] 28.7 Test: Unread count updates correctly

- [x] 29. Performance testing
  - [x] 29.1 Verify chat list loads in < 500ms with 100 chats
  - [x] 29.2 Verify message list loads in < 300ms with 1000 messages
  - [x] 29.3 Verify real-time latency < 1 second

## Task Dependencies

```
Phase 1 (Database Schema) → Phase 2 (Triggers/RPC) → Phase 3 (RLS Policies)
                                                    ↓
                                              Phase 4 (API Layer)
                                                    ↓
                                              Phase 5 (UI Updates)
                                                    ↓
                                    Phase 6 (Property Tests) + Phase 7 (Integration Tests)
                                                    ↓
                                              Phase 8 (i18n)
                                                    ↓
                                              Phase 9 (Cleanup)
                                                    ↓
                                              Phase 10 (Verification)
```

## Critical Path

The following tasks are on the critical path and must be completed in order:

1. Task 1: Create database migration file
2. Task 2: Migrate existing data
3. Task 3: Create database triggers
4. Task 4: Create RPC functions
5. Task 5-7: Update RLS policies
6. Task 8: Generate TypeScript types
7. Task 10: Implement new API functions
8. Task 12-13: Update UI components
9. Task 15-22: Write property tests
10. Task 27: Run all tests

## Estimated Effort

- Phase 1-3 (Database): 4-6 hours
- Phase 4 (API Layer): 3-4 hours
- Phase 5 (UI Updates): 4-6 hours
- Phase 6-7 (Testing): 8-10 hours
- Phase 8-10 (i18n, Cleanup, Verification): 2-3 hours

**Total Estimated Effort**: 21-29 hours

## Success Criteria

Implementation is complete when:

1. ✅ All database migrations applied successfully
2. ✅ All triggers and RPC functions created and tested
3. ✅ All RLS policies updated and verified
4. ✅ All API functions implemented and working
5. ✅ All UI components updated and functional
6. ✅ All 38 property tests passing
7. ✅ All integration tests passing
8. ✅ Manual testing completed successfully
9. ✅ Performance requirements met (< 500ms chat list, < 300ms messages)
10. ✅ No data loss from migration
11. ✅ Existing 1-on-1 chats preserved and functional
12. ✅ Documentation updated

## Rollback Plan

If critical issues are discovered:

1. **Before Phase 9 (Cleanup)**: Rollback is straightforward
   - Restore old RLS policies
   - Drop new triggers
   - Drop chat_participants table
   - Remove type and walk_id columns

2. **After Phase 9 (Cleanup)**: Rollback requires data reconstruction
   - Restore requester_id/walker_id from chat_participants
   - Restore old RLS policies
   - Remove new triggers and RPC functions

## Notes

- All database changes must follow the migration workflow in `.kiro/steering/database-workflow.md`
- All tests must follow the testing workflow in `.kiro/steering/database-testing.md`
- TypeScript types must be regenerated after every database schema change
- Real-time subscriptions must be updated to use new schema
- Existing 1-on-1 chats must remain functional throughout migration
