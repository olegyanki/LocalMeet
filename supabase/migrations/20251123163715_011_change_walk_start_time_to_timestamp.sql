/*
  # Change walk_start_time format to timestamptz

  1. Changes
    - Drop the old walk_start_time column (text format "HH:MM")
    - Add new walk_start_time column as timestamptz (full timestamp)
    - Update existing data is not needed as this is demo data

  2. Notes
    - This allows proper date/time calculations
    - Supports future dates and accurate time differences
    - Better integration with JavaScript Date objects
*/

-- Drop old text-based walk_start_time column
ALTER TABLE profiles DROP COLUMN IF EXISTS walk_start_time;

-- Add new timestamptz walk_start_time column
ALTER TABLE profiles ADD COLUMN walk_start_time timestamptz;

-- Update RLS policies remain the same as they work with any column type