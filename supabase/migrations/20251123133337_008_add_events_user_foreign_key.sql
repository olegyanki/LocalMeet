/*
  # Add foreign key relationship for events.user_id

  1. Changes
    - Add foreign key constraint from events.user_id to profiles.id
    - This enables Supabase to properly join tables in queries

  2. Notes
    - Required for PostgREST to understand the relationship
    - Allows using `profiles!user_id` syntax in select queries
*/

DO $$
BEGIN
  -- Check if foreign key doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_user_id_fkey' 
    AND table_name = 'events'
  ) THEN
    -- Add foreign key constraint
    ALTER TABLE events 
    ADD CONSTRAINT events_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;