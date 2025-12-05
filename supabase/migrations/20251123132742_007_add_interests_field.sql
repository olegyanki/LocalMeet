/*
  # Add interests field to profiles

  1. Changes
    - Add `interests` column to `profiles` table as text array
    - Default to empty array for existing profiles

  2. Notes
    - Interests will store user's hobbies and interests as an array of strings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'interests'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
  END IF;
END $$;