-- Migration: Create transactional RPC function for chat creation from walk request
-- Bug Fix: 1.10 - Non-Transactional Chat Creation
-- This function wraps chat creation and walk_request update in a single atomic transaction
-- to prevent data inconsistency if either operation fails.

-- Create RPC function for transactional chat creation
CREATE OR REPLACE FUNCTION public.create_chat_from_request_transactional(
  p_request_id UUID,
  p_requester_id UUID,
  p_walker_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_chat_id UUID;
  v_new_chat_id UUID;
BEGIN
  -- Check if chat already exists for this walk_request (idempotency)
  SELECT id INTO v_existing_chat_id
  FROM public.chats
  WHERE walk_request_id = p_request_id;
  
  -- If chat already exists, return existing chat_id
  IF v_existing_chat_id IS NOT NULL THEN
    RETURN v_existing_chat_id;
  END IF;
  
  -- Create new chat (transaction begins implicitly)
  INSERT INTO public.chats (walk_request_id, requester_id, walker_id)
  VALUES (p_request_id, p_requester_id, p_walker_id)
  RETURNING id INTO v_new_chat_id;
  
  -- Update walk_request status to 'accepted'
  -- This happens in the same transaction as the chat creation
  UPDATE public.walk_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id;
  
  -- If we reach here, both operations succeeded
  -- Transaction commits implicitly on successful return
  RETURN v_new_chat_id;
  
  -- If any error occurs, PostgreSQL automatically rolls back the entire transaction
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Error in create_chat_from_request_transactional: %', SQLERRM;
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_chat_from_request_transactional(UUID, UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_chat_from_request_transactional IS 
  'Creates chat from walk request with transaction atomicity. Both chat creation and request status update succeed or both fail. Idempotent - returns existing chat_id if chat already exists for the request.';

-- Verification query (commented out - for manual testing)
-- SELECT proname, proargnames, proargtypes, prosecdef 
-- FROM pg_proc 
-- WHERE proname = 'create_chat_from_request_transactional';

-- Rollback SQL (for reference):
-- DROP FUNCTION IF EXISTS public.create_chat_from_request_transactional(UUID, UUID, UUID);
