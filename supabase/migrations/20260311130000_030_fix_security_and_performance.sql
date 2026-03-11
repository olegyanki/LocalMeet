-- Migration: Fix Security and Performance Issues
-- Date: 2026-03-11
-- 
-- This migration fixes issues identified by Supabase Advisors:
-- 1. Add SECURITY DEFINER to get_nearby_walks
-- 2. Fix search_path for get_my_chats_optimized
-- 3. Optimize RLS policies (auth.uid() → SELECT auth.uid())
-- 4. Remove duplicate RLS policies on interests table
-- 5. Drop unused indexes
-- 6. Drop unused tables (connection_requests, interests)

-- ============================================================================
-- 1. Fix RPC Functions Security
-- ============================================================================

-- Add SECURITY DEFINER to get_nearby_walks
ALTER FUNCTION public.get_nearby_walks(double precision, double precision, double precision)
SECURITY DEFINER;

-- Fix search_path for get_my_chats_optimized (already has SECURITY DEFINER)
-- Note: The function already has SET search_path in its definition from migration 027
-- This is a verification/re-application to ensure it's set
ALTER FUNCTION public.get_my_chats_optimized(uuid)
SET search_path TO 'public';

COMMENT ON FUNCTION public.get_nearby_walks IS 
  'Returns nearby walks within specified radius. Uses SECURITY DEFINER for consistent access.';

-- ============================================================================
-- 2. Optimize RLS Policies - Replace auth.uid() with (SELECT auth.uid())
-- ============================================================================

-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Fix interests table RLS policies (will be dropped later, but fix for now)
DROP POLICY IF EXISTS "Users can manage own interests" ON interests;
CREATE POLICY "Users can manage own interests" ON interests
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 3. Remove Duplicate RLS Policies on interests table
-- ============================================================================

-- The interests table has two SELECT policies which is suboptimal:
-- - "Interests are viewable by all"
-- - "Users can manage own interests"
-- 
-- We'll keep only one comprehensive policy

DROP POLICY IF EXISTS "Interests are viewable by all" ON interests;
DROP POLICY IF EXISTS "Users can manage own interests" ON interests;

-- Create single comprehensive policy
CREATE POLICY "Interests access policy" ON interests
  FOR ALL
  TO authenticated
  USING (true)  -- All can read
  WITH CHECK ((SELECT auth.uid()) = user_id);  -- Only owner can modify

-- ============================================================================
-- 4. Drop Unused Indexes
-- ============================================================================

-- Drop unused indexes identified by Supabase Advisor
DROP INDEX IF EXISTS public.walks_deleted_start_time_idx;
DROP INDEX IF EXISTS public.messages_sender_id_idx;
DROP INDEX IF EXISTS public.connection_requests_from_user_id_idx;
DROP INDEX IF EXISTS public.connection_requests_to_user_id_idx;
DROP INDEX IF EXISTS public.interests_user_id_idx;

COMMENT ON TABLE walks IS 
  'Removed walks_deleted_start_time_idx as it duplicates walks_active_time_idx functionality';

COMMENT ON TABLE messages IS 
  'Removed messages_sender_id_idx as it was never used in queries';

-- ============================================================================
-- 5. Drop Unused Tables
-- ============================================================================

-- Drop connection_requests table (not used in application)
DROP TABLE IF EXISTS public.connection_requests CASCADE;

-- Drop interests table (interests stored in profiles.interests array instead)
DROP TABLE IF EXISTS public.interests CASCADE;

-- ============================================================================
-- 6. Add Comments for Documentation
-- ============================================================================

COMMENT ON FUNCTION public.get_nearby_walks IS 
  'Returns nearby walks within radius. Optimized with SECURITY DEFINER and proper search_path.';

COMMENT ON FUNCTION public.get_my_chats_optimized IS 
  'Optimized chat loading function. Returns all chat data in single query (1 query vs 31). Uses SECURITY DEFINER with fixed search_path for security.';

COMMENT ON FUNCTION public.get_nearby_walks_filtered IS 
  'Returns filtered nearby walks. Server-side filtering by interests, time, and distance. Uses SECURITY DEFINER with fixed search_path.';

COMMENT ON FUNCTION public.create_chat_from_request_transactional IS 
  'Creates chat from walk request in single transaction. Ensures data consistency. Uses SECURITY DEFINER with fixed search_path.';

-- ============================================================================
-- Verification Queries (for testing)
-- ============================================================================

-- Verify RPC functions have correct settings
-- Run this after migration to confirm:
-- 
-- SELECT 
--   p.proname AS function_name,
--   p.prosecdef AS security_definer,
--   pg_get_function_identity_arguments(p.oid) AS arguments
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname LIKE 'get_%'
-- ORDER BY p.proname;

-- Verify unused indexes are dropped
-- Run this after migration to confirm:
--
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname IN (
--     'walks_deleted_start_time_idx',
--     'messages_sender_id_idx',
--     'connection_requests_from_user_id_idx',
--     'connection_requests_to_user_id_idx',
--     'interests_user_id_idx'
--   );
-- Should return 0 rows

-- Verify tables are dropped
-- Run this after migration to confirm:
--
-- SELECT tablename 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('connection_requests', 'interests');
-- Should return 0 rows
