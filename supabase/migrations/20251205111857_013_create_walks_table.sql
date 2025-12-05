/*
  # Create Walks Table

  1. New Tables
    - `walks` - Active walks/events created by users
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - User who created the walk
      - `start_time` (timestamptz) - When the walk starts
      - `duration` (text) - How long the walk will last
      - `description` (text, nullable) - Description of the walk
      - `latitude` (numeric) - Walk meeting location latitude
      - `longitude` (numeric) - Walk meeting location longitude
      - `is_active` (boolean) - Whether walk is currently active
      - `created_at` (timestamptz) - When walk was created
      - `updated_at` (timestamptz) - Last update time
      
  2. Changes to Existing Tables
    - Remove walk-related fields from profiles table:
      - is_walking
      - walk_start_time
      - walk_duration
      - walk_description
      - walk_latitude
      - walk_longitude
      - walk_updated_at
      
  3. Security
    - Enable RLS on walks table
    - Anyone can view active walks
    - Users can create their own walks
    - Users can update/delete only their own walks
*/

-- Create walks table
CREATE TABLE IF NOT EXISTS walks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  duration text NOT NULL,
  description text,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE walks ENABLE ROW LEVEL SECURITY;

-- Walks policies
CREATE POLICY "Active walks are viewable by all"
  ON walks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create own walks"
  ON walks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walks"
  ON walks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own walks"
  ON walks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_walks_user_id ON walks(user_id);
CREATE INDEX IF NOT EXISTS idx_walks_is_active ON walks(is_active);
CREATE INDEX IF NOT EXISTS idx_walks_start_time ON walks(start_time);

-- Remove walk fields from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS is_walking;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_start_time;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_duration;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_description;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_latitude;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_longitude;
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_updated_at;
