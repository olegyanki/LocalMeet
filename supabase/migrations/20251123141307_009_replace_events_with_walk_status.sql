/*
  # Replace Events with Walk Status

  1. Changes
    - Drop events table
    - Add walk status fields to profiles table:
      - `is_walking` (boolean) - whether user is currently walking
      - `walk_start_time` (text) - when they start walking (e.g., "18:00")
      - `walk_duration` (text) - how long they'll walk (e.g., "2 hours")
      - `walk_description` (text) - description of their walk
      - `walk_updated_at` (timestamptz) - when walk status was last updated

  2. Security
    - Update RLS policies for profiles table to allow users to update their walk status
*/

DROP TABLE IF EXISTS events CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_walking'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_walking boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_start_time'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_start_time text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_duration'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_duration text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_description'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
