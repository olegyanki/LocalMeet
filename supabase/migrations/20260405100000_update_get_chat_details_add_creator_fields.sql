-- Update get_chat_details RPC function:
-- 1. Add new return fields: creator_avatar_url, creator_first_name, walk_type
-- 2. Add LEFT JOIN with profiles on walks.user_id to get walk creator info
-- 3. Preserve ALL existing fields and logic
--
-- Requirements: 3.2

-- Drop old function signature first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_chat_details(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_chat_details(p_chat_id UUID, p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  chat_created_at TIMESTAMPTZ,
  walk_id UUID,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  walk_type TEXT,
  creator_avatar_url TEXT,
  creator_first_name TEXT,
  participant_id UUID,
  participant_first_name TEXT,
  participant_last_name TEXT,
  participant_avatar_url TEXT,
  participant_role TEXT,
  participant_joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_participants cp_check
    WHERE cp_check.chat_id = p_chat_id AND cp_check.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant of this chat';
  END IF;

  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.type AS chat_type,
    c.created_at AS chat_created_at,
    c.walk_id,
    w.title AS walk_title,
    w.image_url AS walk_image_url,
    w.start_time AS walk_start_time,
    w.type AS walk_type,
    -- Walk creator profile info (for live event chat display)
    creator_profile.avatar_url AS creator_avatar_url,
    creator_profile.first_name AS creator_first_name,
    p.id AS participant_id,
    p.first_name AS participant_first_name,
    p.last_name AS participant_last_name,
    p.avatar_url AS participant_avatar_url,
    cp.role AS participant_role,
    cp.joined_at AS participant_joined_at
  FROM public.chats c
  LEFT JOIN public.walks w ON c.walk_id = w.id
  -- Join to get walk creator profile (for live event display)
  LEFT JOIN public.profiles creator_profile ON w.user_id = creator_profile.id
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id
  INNER JOIN public.profiles p ON cp.user_id = p.id
  WHERE c.id = p_chat_id
  ORDER BY cp.joined_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_chat_details IS 
  'Chat details function. Returns chat data with all participants and creator info (avatar, name, walk_type) for live event display.';
