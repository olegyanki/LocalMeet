-- Update get_my_chats_optimized RPC function:
-- 1. Add new return fields: creator_avatar_url, creator_first_name, walk_type
-- 2. Add JOIN with profiles on walks.user_id to get walk creator info
-- 3. Add WHERE filter to exclude empty finished live event chats
--    (type='live', event ended, only owner in chat, no messages)
--
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1

-- Drop old function signature first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_my_chats_optimized(UUID);

CREATE OR REPLACE FUNCTION public.get_my_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  walk_id UUID,
  chat_updated_at TIMESTAMPTZ,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  walk_type TEXT,
  creator_avatar_url TEXT,
  creator_first_name TEXT,
  participant_ids UUID[],
  participant_first_names TEXT[],
  participant_last_names TEXT[],
  participant_avatar_urls TEXT[],
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  last_message_read BOOLEAN,
  last_message_image_urls JSONB,
  last_message_audio_url TEXT,
  unread_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.type AS chat_type,
    c.walk_id,
    c.updated_at AS chat_updated_at,
    w.title AS walk_title,
    w.image_url AS walk_image_url,
    w.start_time AS walk_start_time,
    w.type AS walk_type,
    -- Walk creator profile info (for live event chat display)
    creator_profile.avatar_url AS creator_avatar_url,
    creator_profile.first_name AS creator_first_name,
    -- Aggregate all participant data (ordered by joined_at for consistency)
    ARRAY_AGG(p.id ORDER BY cp_all.joined_at) AS participant_ids,
    ARRAY_AGG(p.first_name ORDER BY cp_all.joined_at) AS participant_first_names,
    ARRAY_AGG(p.last_name ORDER BY cp_all.joined_at) AS participant_last_names,
    ARRAY_AGG(p.avatar_url ORDER BY cp_all.joined_at) AS participant_avatar_urls,
    -- Last message details
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
    m.image_urls AS last_message_image_urls,
    m.audio_url AS last_message_audio_url,
    -- Unread count for this user
    (
      SELECT COUNT(*)::INTEGER
      FROM public.messages msg
      WHERE msg.chat_id = c.id 
        AND msg.sender_id != p_user_id
        AND msg.read = false
    ) AS unread_count
  FROM public.chats c
  -- Join to get user's membership
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id AND cp.user_id = p_user_id
  -- Join to get all participants
  INNER JOIN public.chat_participants cp_all ON cp_all.chat_id = c.id
  INNER JOIN public.profiles p ON cp_all.user_id = p.id
  -- Join to get walk details (for group chats)
  LEFT JOIN public.walks w ON c.walk_id = w.id
  -- Join to get walk creator profile (for live event display)
  LEFT JOIN public.profiles creator_profile ON w.user_id = creator_profile.id
  -- Join to get last message
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at, msg.sender_id, msg.read, msg.image_urls, msg.audio_url
    FROM public.messages msg
    WHERE msg.chat_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  -- Filter out empty finished live event chats:
  -- Exclude chats where: live event ended AND only 1 participant (owner) AND no messages
  WHERE NOT (
    w.type = 'live'
    AND (w.start_time + (w.duration * INTERVAL '1 second')) < NOW()
    AND (
      SELECT COUNT(*)
      FROM public.chat_participants cp_count
      WHERE cp_count.chat_id = c.id
    ) = 1
    AND NOT EXISTS (
      SELECT 1
      FROM public.messages msg_check
      WHERE msg_check.chat_id = c.id
    )
  )
  GROUP BY c.id, c.type, c.walk_id, c.updated_at, 
           w.title, w.image_url, w.start_time, w.type,
           creator_profile.avatar_url, creator_profile.first_name,
           m.content, m.created_at, m.sender_id, m.read, m.image_urls, m.audio_url
  ORDER BY c.updated_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_my_chats_optimized IS 
  'Optimized chat loading function. Returns all chat data including creator info (avatar, name, walk_type) for live event display. Filters out empty finished live event chats (participant_count=1, message_count=0).';
