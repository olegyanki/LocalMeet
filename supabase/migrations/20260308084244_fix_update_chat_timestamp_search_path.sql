-- Fix update_chat_timestamp function search_path
-- Error: relation "chats" does not exist
-- Cause: Function has SET search_path TO '' which prevents finding the chats table
-- Fix: Set search_path to 'public' to access tables

CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE chats
  SET updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- Rollback SQL (if needed):
-- CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- SET search_path TO ''
-- AS $$
-- BEGIN
--   UPDATE chats SET updated_at = NEW.created_at WHERE id = NEW.chat_id;
--   RETURN NEW;
-- END;
-- $$;
