/*
  # Add Soft Delete Support to Walks Table

  1. Changes
    - Add `deleted` boolean field to walks table (default false)
    - Marks walks as deleted instead of removing them from database
    - Allows keeping walk history for future features
    
  2. Updates to RLS Policies
    - Update SELECT policy to exclude deleted walks
    - Only show walks where deleted is false or null
    
  3. Important Notes
    - Existing walks will have deleted = false by default
    - Deleted walks remain in database but hidden from queries
    - Preserves data for potential walk history features
*/

-- Add deleted field to walks table
ALTER TABLE walks ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Active walks are viewable by all" ON walks;

-- Create new SELECT policy that excludes deleted walks
CREATE POLICY "Active non-deleted walks are viewable by all"
  ON walks FOR SELECT
  USING (deleted = false OR deleted IS NULL);

-- Create index for faster queries on deleted field
CREATE INDEX IF NOT EXISTS idx_walks_deleted ON walks(deleted);