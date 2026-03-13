-- Migration: Group Chat System - Database Triggers
-- Description: Create triggers for automatic group chat creation and participant management
-- Phase 2: Database Triggers and Functions

-- ============================================================================
-- Prerequisite: Make old columns nullable
-- ============================================================================
-- Make requester_id and walker_id nullable so group chats can be created
-- without these columns (they will be removed in a future cleanup migration)

ALTER TABLE public.chats 
  ALTER COLUMN requester_id DROP NOT NULL,
  ALTER COLUMN walker_id DROP NOT NULL;

-- ============================================================================
-- Trigger 1: Auto-create group chat on event creation
-- ============================================================================
-- Purpose: Automatically creates a group chat when an event is created
--          and adds the creator as owner

CREATE OR REPLACE FUNCTION public.create_group_chat_on_walk_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Create group chat for the new walk
  INSERT INTO public.chats (type, walk_id)
  VALUES ('group', NEW.id)
  RETURNING id INTO new_chat_id;
  
  -- Add walk creator as owner
  INSERT INTO public.chat_participants (chat_id, user_id, role)
  VALUES (new_chat_id, NEW.user_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after walk insert
CREATE TRIGGER create_group_chat_on_walk_insert_trigger
  AFTER INSERT ON public.walks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_group_chat_on_walk_insert();

-- ============================================================================
-- Trigger 2: Auto-add participant on request acceptance
-- ============================================================================
-- Purpose: Automatically adds users to group chat when their walk request
--          is accepted

CREATE OR REPLACE FUNCTION public.add_participant_on_request_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_chat_id UUID;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Find the group chat for this walk
    SELECT id INTO target_chat_id
    FROM public.chats
    WHERE walk_id = NEW.walk_id AND type = 'group'
    LIMIT 1;
    
    -- If chat exists, add participant
    IF target_chat_id IS NOT NULL THEN
      INSERT INTO public.chat_participants (chat_id, user_id, role)
      VALUES (target_chat_id, NEW.requester_id, 'member')
      ON CONFLICT (chat_id, user_id) DO NOTHING;  -- Idempotent
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after walk_requests update
CREATE TRIGGER add_participant_on_request_accept_trigger
  AFTER UPDATE ON public.walk_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.add_participant_on_request_accept();

-- ============================================================================
-- Trigger 3: Transfer ownership on creator leave
-- ============================================================================
-- Purpose: Transfers ownership to the next participant when the owner
--          leaves the chat

CREATE OR REPLACE FUNCTION public.transfer_ownership_on_creator_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining_count INTEGER;
  next_owner_id UUID;
BEGIN
  -- Only proceed if deleting an owner
  IF OLD.role = 'owner' THEN
    -- Count remaining participants (excluding the one being deleted)
    SELECT COUNT(*) INTO remaining_count
    FROM public.chat_participants
    WHERE chat_id = OLD.chat_id AND user_id != OLD.user_id;
    
    -- If participants remain, transfer ownership
    IF remaining_count > 0 THEN
      -- Find earliest joined member (excluding the one being deleted)
      SELECT user_id INTO next_owner_id
      FROM public.chat_participants
      WHERE chat_id = OLD.chat_id AND user_id != OLD.user_id
      ORDER BY joined_at ASC
      LIMIT 1;
      
      -- Promote to owner
      IF next_owner_id IS NOT NULL THEN
        UPDATE public.chat_participants
        SET role = 'owner'
        WHERE chat_id = OLD.chat_id AND user_id = next_owner_id;
      END IF;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger that fires after chat_participants delete
-- Note: AFTER trigger is used instead of BEFORE to avoid modification conflicts
CREATE TRIGGER transfer_ownership_on_creator_leave_trigger
  AFTER DELETE ON public.chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.transfer_ownership_on_creator_leave();

-- ============================================================================
-- Verification Notes
-- ============================================================================
-- After applying this migration, verify triggers work correctly:
--
-- 1. Test group chat creation:
--    INSERT INTO walks (user_id, title, start_time, duration, latitude, longitude)
--    VALUES ('user-id', 'Test Walk', NOW() + INTERVAL '1 hour', 3600, 50.4501, 30.5234);
--    -- Verify chat created: SELECT * FROM chats WHERE walk_id = 'new-walk-id';
--    -- Verify owner added: SELECT * FROM chat_participants WHERE chat_id = 'new-chat-id';
--
-- 2. Test participant addition:
--    UPDATE walk_requests SET status = 'accepted' WHERE id = 'request-id';
--    -- Verify participant added: SELECT * FROM chat_participants WHERE chat_id = 'chat-id';
--
-- 3. Test ownership transfer:
--    DELETE FROM chat_participants WHERE chat_id = 'chat-id' AND role = 'owner';
--    -- Verify new owner: SELECT * FROM chat_participants WHERE chat_id = 'chat-id' AND role = 'owner';
