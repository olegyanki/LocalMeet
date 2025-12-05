/*
  # Enhance Profile Fields

  1. Changes to profiles table
    - Add age field (integer)
    - Add gender field (text)
    - Add languages field (text array)
    - Add social_instagram field (text)
    - Add social_telegram field (text)
    - Add looking_for field (text) - what user is looking for

  2. Notes
    - All new fields are optional (nullable)
    - No breaking changes to existing data
    - Social links for better connection options
    - Languages to find people who speak same languages
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'social_instagram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_instagram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'social_telegram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_telegram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'looking_for'
  ) THEN
    ALTER TABLE profiles ADD COLUMN looking_for text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_age_idx ON profiles(age);
CREATE INDEX IF NOT EXISTS profiles_languages_idx ON profiles USING GIN(languages);
