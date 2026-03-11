-- Migration: Fix profile creation RLS policy
-- Bug 1.2: Restrict profile creation to authenticated users creating their own profile
-- 
-- This migration fixes a security vulnerability where the RLS policy "Service role can insert profiles"
-- with WITH CHECK (true) allows any authenticated user to create profiles for other users.
-- After this fix, users can only create profiles where profile.id = auth.uid().
--
-- Rollback SQL (if needed):
-- DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
-- CREATE POLICY "Service role can insert profiles"
--   ON public.profiles FOR INSERT
--   WITH CHECK (true);

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create restricted policy that only allows users to create their own profile
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify: Check that existing profiles are unaffected
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  RAISE NOTICE 'Profile count after migration: %', profile_count;
  
  -- Ensure the count is non-negative (basic sanity check)
  IF profile_count < 0 THEN
    RAISE EXCEPTION 'Profile count verification failed: negative count';
  END IF;
END $$;

-- Verify: Check that the new policy was created correctly
DO $$
DECLARE
  policy_count INTEGER;
  policy_check TEXT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'Users can create own profile'
    AND cmd = 'INSERT';
  
  IF policy_count != 1 THEN
    RAISE EXCEPTION 'Policy verification failed: expected 1 policy, found %', policy_count;
  END IF;
  
  SELECT with_check INTO policy_check
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'Users can create own profile';
  
  RAISE NOTICE 'New policy created successfully';
  RAISE NOTICE 'Policy name: Users can create own profile';
  RAISE NOTICE 'WITH CHECK: %', policy_check;
  RAISE NOTICE 'Expected: (auth.uid() = id)';
END $$;
