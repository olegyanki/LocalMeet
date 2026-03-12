-- Migration: Update RLS Policies for Group Chat System
-- Description: Update RLS policies for chats, chat_participants, and messages tables
-- Phase 4: Update RLS Policies

-- ============================================================================
-- Task 5: Update RLS policies for chats table
-- ============================================================================

-- Task 5.1: Drop old policies
DROP POLICY IF EXISTS "Users can view chats where they are participants" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete chats they participate in" ON public.chats;
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;

-- Task 5.2: Create policy: "Users can view their chats"
-- Users can view chats where they are participants (via chat_participants table)
CREATE POLICY "Users can view their chats"
  ON public.chats FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Task 5.3: Create policy: "System can create chats"
-- Chats are created by triggers with SECURITY DEFINER, so allow all inserts
CREATE POLICY "System can create chats"
  ON public.chats FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Task 6: Create RLS policies for chat_participants table
-- ============================================================================

-- Task 6.1: Enable RLS on chat_participants (already done in migration 031)
-- ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Task 6.2: Create policy: "Users can view participants of their chats"
-- Users can view all participants of chats they are members of
CREATE POLICY "Users can view participants of their chats"
  ON public.chat_participants FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Task 6.3: Create policy: "System can insert participants"
-- Participants are added by triggers with SECURITY DEFINER, so allow all inserts
CREATE POLICY "System can insert participants"
  ON public.chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Task 6.4: Create policy: "Users can leave chats"
-- Users can delete their own membership record to leave a chat
CREATE POLICY "Users can leave chats"
  ON public.chat_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Task 6.5: Create policy: "Owners can remove participants"
-- Owners can remove other participants from chats they own
CREATE POLICY "Owners can remove participants"
  ON public.chat_participants FOR DELETE
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- Task 7: Update RLS policies for messages table
-- ============================================================================

-- Task 7.1: Drop old policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status of messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Task 7.2: Create policy: "Users can view messages in their chats"
-- Users can view messages in chats where they are participants
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Task 7.3: Create policy: "Participants can send messages"
-- Users can send messages to chats where they are participants
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- Task 7.4: Create policy: "Users can mark messages as read"
-- Users can update read status of messages in chats they are participants of
CREATE POLICY "Users can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    chat_id IN (
      SELECT chat_id FROM public.chat_participants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Validation Queries (for manual verification)
-- ============================================================================
-- Run these queries after migration to verify RLS policies work correctly:
--
-- 1. Verify users can only see their own chats:
--    SET LOCAL ROLE authenticated;
--    SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';
--    SELECT * FROM public.chats;  -- Should only return chats where user is participant
--
-- 2. Verify users can only see participants of their chats:
--    SELECT * FROM public.chat_participants;  -- Should only return participants of user's chats
--
-- 3. Verify users can only see messages in their chats:
--    SELECT * FROM public.messages;  -- Should only return messages from user's chats
--
-- 4. Verify users can leave chats:
--    DELETE FROM public.chat_participants WHERE user_id = auth.uid() AND chat_id = 'chat-id';
--
-- 5. Verify owners can remove participants:
--    DELETE FROM public.chat_participants WHERE chat_id = 'chat-id' AND user_id = 'other-user-id';
--    -- Should succeed if current user is owner, fail otherwise
