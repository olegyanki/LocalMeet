-- Migration: Create get_my_chats_optimized RPC function
-- Bug 1.6: N+1 Query Problem in getMyChats
-- 
-- This migration creates an optimized RPC function that uses JOINs and LATERAL joins
-- to fetch all chat data in a single query instead of 1 + 3N queries.
--
-- Performance improvement:
--   Before: 1 + 3N queries (e.g., 31 queries for 10 chats)
--   After: 1 query regardless of chat count

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chat_id,
    c.requester_id,
    c.walker_id,
    c.walk_request_id,
    c.updated_at AS chat_updated_at,
    -- Requester profile
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
    -- Walker profile
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
    -- Last message (using LATERAL join for efficiency)
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
    -- Walk info (if walk_request_id exists)
    w.title AS walk_title,
    w.image_url AS walk_image_url
  FROM public.chats c
  -- Join requester profile
  INNER JOIN public.profiles p_req ON c.requester_id = p_req.id
  -- Join walker profile
  INNER JOIN public.profiles p_walk ON c.walker_id = p_walk.id
  -- LATERAL join for last message (most efficient way to get one row per chat)
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id, read
    FROM public.messages
    WHERE chat_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  -- LEFT JOIN for walk_request (may be NULL after Bug 1.1 fix)
  LEFT JOIN public.walk_requests wr ON c.walk_request_id = wr.id
  -- LEFT JOIN for walk info
  LEFT JOIN public.walks w ON wr.walk_id = w.id
  -- Filter: only chats where user is participant
  WHERE c.requester_id = p_user_id OR c.walker_id = p_user_id
  -- Sort by most recent activity
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_chats_optimized(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_my_chats_optimized(UUID) IS 
'Optimized function to fetch user chats with all related data in a single query.
Fixes Bug 1.6: N+1 Query Problem by using JOINs and LATERAL joins.
Performance: O(1) queries instead of O(N) queries.';

-- Verification query
DO $$
BEGIN
  -- Verify function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_my_chats_optimized'
  ) THEN
    RAISE EXCEPTION 'Function get_my_chats_optimized was not created';
  END IF;
  
  RAISE NOTICE 'Migration 027: get_my_chats_optimized function created successfully';
END $$;
