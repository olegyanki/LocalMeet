/*
  # Fix UPDATE policy with explicit WITH CHECK

  1. Changes
    - Drop existing UPDATE policy
    - Create new UPDATE policy with explicit WITH CHECK (true)
    - This allows any update to owned walks without restrictions

  2. Security
    - USING clause verifies user owns the walk
    - WITH CHECK (true) allows all updates to pass
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own walks" ON walks;

-- Create new UPDATE policy with explicit WITH CHECK (true)
CREATE POLICY "Users can update own walks"
  ON walks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (true);
