-- Fix ambiguous column reference in get_my_chats_optimized
-- Error: column reference "chat_id" is ambiguous
-- Fix: Explicitly qualify the column with table alias

CREATE OR REPLACE FUNCTION public.get_my_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  requester_id UUID,
  walker_id UUID,
  walk_request_id UUID,
  chat_updated_at TIMESTAMPTZ,
  requester_username TEXT,
  requester_display_name TEXT,
  requester_avatar_url TEXT,
  requester_bio TEXT,
  requester_status TEXT,
  requester_age INTEGER,
  requester_gender TEXT,
  requester_languages TEXT[],
  requester_interests TEXT[],
  requester_social_instagram TEXT,
  requester_social_telegram TEXT,
  requester_looking_for TEXT,
  walker_username TEXT,
  walker_display_name TEXT,
  walker_avatar_url TEXT,
  walker_bio TEXT,
  walker_status TEXT,
  walker_age INTEGER,
  walker_gender TEXT,
  walker_languages TEXT[],
  walker_interests TEXT[],
  walker_social_instagram TEXT,
  walker_social_telegram TEXT,
  walker_looking_for TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  last_message_read BOOLEAN,
  walk_title TEXT,
  walk_image_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.requester_id,
    c.walker_id,
    c.walk_request_id,
    c.updated_at AS chat_updated_at,
    p_req.username AS requester_username,
    p_req.display_name AS requester_display_name,
    p_req.avatar_url AS requester_avatar_url,
    p_req.bio AS requester_bio,
    p_req.status AS requester_status,
    p_req.age AS requester_age,
    p_req.gender AS requester_gender,
    p_req.languages AS requester_languages,
    p_req.interests AS requester_interests,
    p_req.social_instagram AS requester_social_instagram,
    p_req.social_telegram AS requester_social_telegram,
    p_req.looking_for AS requester_looking_for,
    p_walk.username AS walker_username,
    p_walk.display_name AS walker_display_name,
    p_walk.avatar_url AS walker_avatar_url,
    p_walk.bio AS walker_bio,
    p_walk.status AS walker_status,
    p_walk.age AS walker_age,
    p_walk.gender AS walker_gender,
    p_walk.languages AS walker_languages,
    p_walk.interests AS walker_interests,
    p_walk.social_instagram AS walker_social_instagram,
    p_walk.social_telegram AS walker_social_telegram,
    p_walk.looking_for AS walker_looking_for,
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
    w.title AS walk_title,
    w.image_url AS walk_image_url
  FROM public.chats c
  INNER JOIN public.profiles p_req ON c.requester_id = p_req.id
  INNER JOIN public.profiles p_walk ON c.walker_id = p_walk.id
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at, msg.sender_id, msg.read
    FROM public.messages msg
    WHERE msg.chat_id = c.id  -- Fixed: explicitly qualify with table alias
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  LEFT JOIN public.walk_requests wr ON c.walk_request_id = wr.id
  LEFT JOIN public.walks w ON wr.walk_id = w.id
  WHERE c.requester_id = p_user_id OR c.walker_id = p_user_id
  ORDER BY c.updated_at DESC;
END;
$$;

-- Rollback SQL:
-- Use the previous version from migration 027_create_get_my_chats_rpc.sql
