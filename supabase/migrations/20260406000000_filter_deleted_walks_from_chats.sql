-- Fix: hide chats linked to soft-deleted walks from chat list
-- Bug: get_my_chats_optimized does LEFT JOIN walks but never checks w.deleted,
-- so chats for deleted events still appear in the user's chat list.
-- Solution: add AND NOT (c.walk_id IS NOT NULL AND w.deleted = true) to WHERE clause.

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
  walk_user_id UUID,
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
    w.user_id AS walk_user_id,
    creator_profile.avatar_url AS creator_avatar_url,
    creator_profile.first_name AS creator_first_name,
    ARRAY_AGG(p.id ORDER BY cp_all.joined_at) AS participant_ids,
    ARRAY_AGG(p.first_name ORDER BY cp_all.joined_at) AS participant_first_names,
    ARRAY_AGG(p.last_name ORDER BY cp_all.joined_at) AS participant_last_names,
    ARRAY_AGG(p.avatar_url ORDER BY cp_all.joined_at) AS participant_avatar_urls,
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
    m.image_urls AS last_message_image_urls,
    m.audio_url AS last_message_audio_url,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.messages msg
      WHERE msg.chat_id = c.id 
        AND msg.sender_id != p_user_id
        AND msg.read = false
    ) AS unread_count
  FROM public.chats c
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id AND cp.user_id = p_user_id
  INNER JOIN public.chat_participants cp_all ON cp_all.chat_id = c.id
  INNER JOIN public.profiles p ON cp_all.user_id = p.id
  LEFT JOIN public.walks w ON c.walk_id = w.id
  LEFT JOIN public.profiles creator_profile ON w.user_id = creator_profile.id
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at, msg.sender_id, msg.read, msg.image_urls, msg.audio_url
    FROM public.messages msg
    WHERE msg.chat_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  WHERE
    -- Filter 1: hide chats linked to soft-deleted walks
    NOT (c.walk_id IS NOT NULL AND (w.deleted = true OR w.id IS NULL))
    -- Filter 2: hide empty finished live event chats (owner-only, no messages)
    AND NOT (
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
           w.title, w.image_url, w.start_time, w.type, w.user_id,
           creator_profile.avatar_url, creator_profile.first_name,
           m.content, m.created_at, m.sender_id, m.read, m.image_urls, m.audio_url
  ORDER BY c.updated_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_my_chats_optimized IS 
  'Optimized chat loading. Returns all chat data with creator info for live event display. Filters out: (1) chats linked to soft-deleted walks, (2) empty finished live event chats (1 participant, 0 messages).';
