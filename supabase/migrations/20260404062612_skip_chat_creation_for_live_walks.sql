-- Migration: Skip group chat creation for live walks
-- Description: Modify create_group_chat_on_walk_insert() trigger function
--              to skip automatic chat creation when walk type is 'live'.
--              For live events, chat is created lazily (on first accepted request
--              or when owner explicitly opens chat).
--              Regular events (type = 'event') keep existing behavior unchanged.
--
-- Requirement 1.1: Live events SHALL NOT create group chat automatically
-- Requirement 1.2: Regular events SHALL create group chat as before (no changes)

CREATE OR REPLACE FUNCTION public.create_group_chat_on_walk_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_chat_id UUID;
BEGIN
  -- Skip chat creation for live events (lazy creation via triggers/API)
  IF NEW.type = 'live' THEN
    RETURN NEW;
  END IF;

  -- Create group chat for regular events
  INSERT INTO public.chats (type, walk_id)
  VALUES ('group', NEW.id)
  RETURNING id INTO new_chat_id;

  -- Add walk creator as owner
  INSERT INTO public.chat_participants (chat_id, user_id, role)
  VALUES (new_chat_id, NEW.user_id, 'owner');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.create_group_chat_on_walk_insert IS
  'Trigger function: creates group chat + owner participant on walk insert. Skips live events (type=live) for lazy chat creation.';
