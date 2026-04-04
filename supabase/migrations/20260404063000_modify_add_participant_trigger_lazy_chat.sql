-- Migration: Modify add_participant_on_request_accept() for lazy chat creation
-- Description: When a walk request is accepted and no group chat exists yet
--              (which happens for live events due to Task 1.1), the trigger now:
--              1. Creates the group chat
--              2. Adds the walk owner as 'owner'
--              3. Adds the requester as 'member'
--              For events with existing chats, behavior is unchanged — just adds the member.
--
-- Requirement 1.3: WHEN request accepted AND no chat exists → create chat + owner + member
-- Requirement 1.4: WHEN request accepted AND chat exists → add member (unchanged)

CREATE OR REPLACE FUNCTION public.add_participant_on_request_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $
DECLARE
  target_chat_id UUID;
  walk_owner_id UUID;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Find the group chat for this walk
    SELECT c.id INTO target_chat_id
    FROM public.chats c
    WHERE c.walk_id = NEW.walk_id AND c.type = 'group'
    LIMIT 1;

    -- If chat does not exist (live event) — create it with owner
    IF target_chat_id IS NULL THEN
      -- Get the walk owner
      SELECT w.user_id INTO walk_owner_id
      FROM public.walks w
      WHERE w.id = NEW.walk_id;

      -- Create group chat linked to the walk
      INSERT INTO public.chats (type, walk_id)
      VALUES ('group', NEW.walk_id)
      RETURNING id INTO target_chat_id;

      -- Add walk creator as owner
      INSERT INTO public.chat_participants (chat_id, user_id, role)
      VALUES (target_chat_id, walk_owner_id, 'owner');
    END IF;

    -- Add requester as member (idempotent via ON CONFLICT)
    INSERT INTO public.chat_participants (chat_id, user_id, role)
    VALUES (target_chat_id, NEW.requester_id, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$;

COMMENT ON FUNCTION public.add_participant_on_request_accept IS
  'Trigger function: adds participant to group chat on walk request acceptance. If no chat exists (live events), creates the chat first with walk owner as owner.';
