/*
  # Fix UPDATE policy for walks table

  1. Changes
    - Drop existing restrictive UPDATE policy
    - Create new UPDATE policy that allows users to soft delete their own walks
    - Remove WITH CHECK clause that was blocking legitimate updates

  2. Security
    - USING clause verifies user owns the walk
    - Allows setting deleted=true
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own walks" ON walks;

-- Create new UPDATE policy without restrictive WITH CHECK
CREATE POLICY "Users can update own walks"
  ON walks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
