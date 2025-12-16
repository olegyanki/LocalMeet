/*
  # Add title field to walks table

  1. Changes
    - Add `title` column to walks table (required field for event name/title)
    - Keep existing `description` field for detailed description
  
  2. Notes
    - Title is a short name for the event (e.g., "Walk in the park")
    - Description provides more details about the event
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'walks' AND column_name = 'title'
  ) THEN
    ALTER TABLE walks ADD COLUMN title text NOT NULL DEFAULT 'Прогулянка';
    ALTER TABLE walks ALTER COLUMN title DROP DEFAULT;
  END IF;
END $$;