-- Migration: Group Chat System - RPC Functions
-- Description: Create optimized RPC functions for chat queries
-- Phase 2: Database Triggers and Functions (Task 4)

-- ============================================================================
-- Drop old function versions (if they exist)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_my_chats_optimized(UUID);
DROP FUNCTION IF EXISTS public.get_chat_details(UUID, UUID);

-- ============================================================================
-- Function 1: get_my_chats_optimized
-- ============================================================================
-- Purpose: Fetch all chats for a user with complete details in a single query
-- Returns: All chats where user is a participant, with:
--   - Chat metadata (id, type, timestamps)
--   - Event details (title, image, start time)
--   - All participant information (aggregated arrays)
--   - Last message details
--   - Unread message count
-- Performance: Single query replaces 1 + 3N queries (where N = number of chats)

CREATE OR REPLACE FUNCTION public.get_my_chats_optimized(p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  walk_id UUID,
  chat_updated_at TIMESTAMPTZ,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  participant_ids UUID[],
  participant_usernames TEXT[],
  participant_display_names TEXT[],
  participant_avatar_urls TEXT[],
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  last_message_read BOOLEAN,
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
    -- Aggregate all participant IDs (ordered by joined_at for consistency)
    ARRAY_AGG(p.id ORDER BY cp_all.joined_at) AS participant_ids,
    ARRAY_AGG(p.username ORDER BY cp_all.joined_at) AS participant_usernames,
    ARRAY_AGG(p.display_name ORDER BY cp_all.joined_at) AS participant_display_names,
    ARRAY_AGG(p.avatar_url ORDER BY cp_all.joined_at) AS participant_avatar_urls,
    -- Last message details
    m.content AS last_message_content,
    m.created_at AS last_message_created_at,
    m.sender_id AS last_message_sender_id,
    m.read AS last_message_read,
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
  -- Join to get last message
  LEFT JOIN LATERAL (
    SELECT msg.content, msg.created_at, msg.sender_id, msg.read
    FROM public.messages msg
    WHERE msg.chat_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) m ON true
  GROUP BY c.id, c.type, c.walk_id, c.updated_at, w.title, w.image_url, w.start_time,
           m.content, m.created_at, m.sender_id, m.read
  ORDER BY c.updated_at DESC;
END;
$$;

-- ============================================================================
-- Function 2: get_chat_details
-- ============================================================================
-- Purpose: Fetch detailed information about a specific chat including all participants
-- Security: Verifies user is a participant before returning data
-- Returns: Chat details with all participants (one row per participant)

CREATE OR REPLACE FUNCTION public.get_chat_details(p_chat_id UUID, p_user_id UUID)
RETURNS TABLE (
  chat_id UUID,
  chat_type TEXT,
  walk_id UUID,
  walk_title TEXT,
  walk_image_url TEXT,
  walk_start_time TIMESTAMPTZ,
  participant_id UUID,
  participant_username TEXT,
  participant_display_name TEXT,
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
    c.walk_id,
    w.title AS walk_title,
    w.image_url AS walk_image_url,
    w.start_time AS walk_start_time,
    p.id AS participant_id,
    p.username AS participant_username,
    p.display_name AS participant_display_name,
    p.avatar_url AS participant_avatar_url,
    cp.role AS participant_role,
    cp.joined_at AS participant_joined_at
  FROM public.chats c
  LEFT JOIN public.walks w ON c.walk_id = w.id
  INNER JOIN public.chat_participants cp ON cp.chat_id = c.id
  INNER JOIN public.profiles p ON cp.user_id = p.id
  WHERE c.id = p_chat_id
  ORDER BY cp.joined_at ASC;
END;
$$;

-- ============================================================================
-- Testing Notes
-- ============================================================================
-- After applying this migration, test the RPC functions with:
--
-- 1. Test get_my_chats_optimized:
--    SELECT * FROM public.get_my_chats_optimized('user-uuid-here');
--
-- 2. Test get_chat_details:
--    SELECT * FROM public.get_chat_details('chat-uuid-here', 'user-uuid-here');
--
-- 3. Verify performance (should be O(1) queries, not O(N)):
--    EXPLAIN ANALYZE SELECT * FROM public.get_my_chats_optimized('user-uuid-here');
