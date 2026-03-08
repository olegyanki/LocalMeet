-- Create interests table (legacy, not actively used - interests moved to profiles array)
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Interests policies
CREATE POLICY "Interests are viewable by everyone"
  ON public.interests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interests"
  ON public.interests FOR ALL
  USING (auth.uid() = user_id);
