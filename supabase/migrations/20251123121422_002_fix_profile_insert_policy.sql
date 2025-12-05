/*
  # Fix Profile Insert Policy

  1. Changes
    - Update profiles INSERT policy to allow unauthenticated users during signup
    - This is safe because we check that the user ID matches auth.uid()
    
  2. Security
    - Users can only insert their own profile during registration
    - The ID must match their auth user ID
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new insert policy that works during signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
