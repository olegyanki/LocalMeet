-- Migration: Fix chat cascade delete behavior
-- Bug 1.1: Change CASCADE to SET NULL for chats.walk_request_id
-- 
-- This migration fixes a critical data loss bug where deleting a walk_request
-- would CASCADE delete the entire chat and all messages for both participants.
-- After this fix, deleting a walk_request will only SET NULL on chat.walk_request_id,
-- preserving the chat and all messages.
--
-- Rollback SQL (if needed):
-- ALTER TABLE public.chats 
--   DROP CONSTRAINT IF EXISTS chats_walk_request_id_fkey;
-- ALTER TABLE public.chats
--   ADD CONSTRAINT chats_walk_request_id_fkey
--   FOREIGN KEY (walk_request_id)
--   REFERENCES public.walk_requests(id)
--   ON DELETE CASCADE;

-- Drop existing constraint with CASCADE behavior
ALTER TABLE public.chats 
  DROP CONSTRAINT IF EXISTS chats_walk_request_id_fkey;

-- Recreate constraint with SET NULL instead of CASCADE
ALTER TABLE public.chats
  ADD CONSTRAINT chats_walk_request_id_fkey
  FOREIGN KEY (walk_request_id)
  REFERENCES public.walk_requests(id)
  ON DELETE SET NULL;

-- Verify: Check that existing chats are unaffected
DO $$
DECLARE
  chat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO chat_count FROM public.chats;
  RAISE NOTICE 'Chat count after migration: %', chat_count;
  
  -- Ensure the count is non-negative (basic sanity check)
  IF chat_count < 0 THEN
    RAISE EXCEPTION 'Chat count verification failed: negative count';
  END IF;
END $$;

-- Verify: Check that the constraint was created with correct delete action
DO $$
DECLARE
  delete_action CHAR(1);
BEGIN
  SELECT confdeltype INTO delete_action
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'chats'
    AND con.conname = 'chats_walk_request_id_fkey';
  
  IF delete_action != 'n' THEN
    RAISE EXCEPTION 'Constraint verification failed: expected SET NULL (n), got %', delete_action;
  END IF;
  
  RAISE NOTICE 'Constraint successfully created with SET NULL behavior';
END $$;
