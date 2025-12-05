/*
  # Add walk location fields

  1. Changes
    - Add `walk_latitude` (numeric) - latitude of walk location
    - Add `walk_longitude` (numeric) - longitude of walk location

  2. Notes
    - These fields store the specific location where the user plans to walk
    - Can be within 15km radius of user's current location
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_latitude numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'walk_longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN walk_longitude numeric;
  END IF;
END $$;
