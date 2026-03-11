-- Migration: Optimize Indexes
-- Bug 1.7: Missing and Unused Indexes
-- 
-- Changes:
-- 1. Add composite index on walks(deleted, start_time) for efficient filtering
-- 2. Note: Unused foreign key indexes were already removed in previous migrations
--
-- Performance Impact:
-- - Queries with WHERE deleted = false AND start_time > NOW() will use single index scan
-- - Improves performance of get_nearby_walks and similar queries
--
-- Rollback:
-- DROP INDEX IF EXISTS walks_deleted_start_time_idx;

-- Add composite index on walks(deleted, start_time)
-- This index is critical for queries that filter by both deleted and start_time
-- Common pattern: WHERE deleted = false AND start_time > NOW()
CREATE INDEX IF NOT EXISTS walks_deleted_start_time_idx 
ON walks(deleted, start_time) 
WHERE deleted = false;

-- Verification: Check that the index was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'walks' 
    AND indexname = 'walks_deleted_start_time_idx'
  ) THEN
    RAISE NOTICE 'Index walks_deleted_start_time_idx created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create index walks_deleted_start_time_idx';
  END IF;
END $$;

-- Note: The separate indexes idx_walks_deleted and idx_walks_start_time still exist
-- PostgreSQL will choose the most efficient index based on the query pattern
-- The composite index will be preferred for queries filtering on both columns
