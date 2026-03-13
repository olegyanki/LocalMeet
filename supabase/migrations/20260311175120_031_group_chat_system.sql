-- Migration: Group Chat System
-- Description: Refactor from 1-on-1 chats to group chats for events
-- Phase 1: Schema Extension (Additive Changes)

-- ============================================================================
-- Step 1: Create chat_participants table
-- ============================================================================
-- Purpose: Junction table that connects users to chats with role information
-- Replaces direct requester_id/walker_id foreign keys in chats table

CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)  -- Prevent duplicate memberships
);

-- Create indexes for performance
CREATE INDEX chat_participants_chat_id_idx ON public.chat_participants(chat_id);
CREATE INDEX chat_participants_user_id_idx ON public.chat_participants(user_id);

-- Enable RLS (policies will be added in Phase 4)
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 2: Add new columns to chats table
-- ============================================================================
-- Add type column to distinguish between 'group' (event chats) and 'direct' (1-on-1 chats)
-- Add walk_id to link group chats to events
-- Both nullable initially to allow data migration

ALTER TABLE public.chats 
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('group', 'direct')),
  ADD COLUMN IF NOT EXISTS walk_id UUID REFERENCES public.walks(id) ON DELETE SET NULL;

-- Create index for walk_id lookups
CREATE INDEX IF NOT EXISTS chats_walk_id_idx ON public.chats(walk_id);

-- ============================================================================
-- Step 3: Migrate existing data
-- ============================================================================
-- Convert all existing chats to 'direct' type
UPDATE public.chats SET type = 'direct' WHERE type IS NULL;

-- Create chat_participants records for existing chats (requester)
INSERT INTO public.chat_participants (chat_id, user_id, role, joined_at)
SELECT 
  id AS chat_id,
  requester_id AS user_id,
  'member' AS role,
  created_at AS joined_at
FROM public.chats
WHERE requester_id IS NOT NULL
ON CONFLICT (chat_id, user_id) DO NOTHING;

-- Create chat_participants records for existing chats (walker)
INSERT INTO public.chat_participants (chat_id, user_id, role, joined_at)
SELECT 
  id AS chat_id,
  walker_id AS user_id,
  'member' AS role,
  created_at AS joined_at
FROM public.chats
WHERE walker_id IS NOT NULL
ON CONFLICT (chat_id, user_id) DO NOTHING;

-- Make type column NOT NULL after data migration
ALTER TABLE public.chats ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.chats ALTER COLUMN type SET DEFAULT 'direct';

-- ============================================================================
-- Validation Queries (for manual verification)
-- ============================================================================
-- Run these queries after migration to verify correctness:
--
-- 1. Verify all chats have a type:
--    SELECT COUNT(*) FROM public.chats WHERE type IS NULL;  -- Should be 0
--
-- 2. Verify all existing chats have exactly 2 participants:
--    SELECT chat_id, COUNT(*) as participant_count
--    FROM public.chat_participants
--    GROUP BY chat_id
--    HAVING COUNT(*) != 2;  -- Should be empty for migrated chats
--
-- 3. Verify no data loss in messages:
--    SELECT COUNT(*) FROM public.messages;  -- Should match pre-migration count
--
-- 4. Verify all participants can access their chats:
--    SELECT cp.user_id, COUNT(DISTINCT cp.chat_id) as chat_count
--    FROM public.chat_participants cp
--    GROUP BY cp.user_id;  -- Should match expected counts

