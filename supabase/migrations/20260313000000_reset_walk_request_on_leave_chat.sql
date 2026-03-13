-- Migration: Reset walk_request when user leaves group chat
-- Description: When a user leaves a group chat (linked to an event), 
--              delete their walk_request so they can re-apply to the event

-- ============================================================================
-- Function: Reset walk request when leaving group chat
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_walk_request_on_leave_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_walk_id UUID;
  v_chat_type TEXT;
BEGIN
  -- Get the chat's walk_id and type
  SELECT walk_id, type INTO v_walk_id, v_chat_type
  FROM chats
  WHERE id = OLD.chat_id;
  
  -- Only process if this is a group chat linked to an event
  IF v_chat_type = 'group' AND v_walk_id IS NOT NULL THEN
    -- Delete the user's walk_request for this event
    -- This allows them to re-apply to the event in the future
    DELETE FROM walk_requests
    WHERE walk_id = v_walk_id
      AND requester_id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Execute function when user leaves chat
-- ============================================================================
DROP TRIGGER IF EXISTS reset_walk_request_on_leave_chat_trigger ON chat_participants;

CREATE TRIGGER reset_walk_request_on_leave_chat_trigger
  BEFORE DELETE ON chat_participants
  FOR EACH ROW
  EXECUTE FUNCTION reset_walk_request_on_leave_chat();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION reset_walk_request_on_leave_chat() IS 
  'Automatically deletes walk_request when user leaves a group chat, allowing them to re-apply to the event';

COMMENT ON TRIGGER reset_walk_request_on_leave_chat_trigger ON chat_participants IS
  'Triggers walk_request deletion when user leaves group chat';
