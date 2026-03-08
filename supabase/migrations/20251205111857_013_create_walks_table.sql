-- Create walks table (events/meetups)
CREATE TABLE IF NOT EXISTS public.walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration BIGINT NOT NULL CHECK (duration > 0),
  description TEXT,
  latitude NUMERIC NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  image_url TEXT,
  deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;

-- Walks policies
CREATE POLICY "Non-deleted walks are viewable by everyone"
  ON public.walks FOR SELECT
  USING (deleted = false);

CREATE POLICY "Users can insert their own walks"
  ON public.walks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walks"
  ON public.walks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own walks"
  ON public.walks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS walks_location_idx ON public.walks (latitude, longitude);
CREATE INDEX IF NOT EXISTS walks_start_time_idx ON public.walks (start_time);
CREATE INDEX IF NOT EXISTS walks_user_id_idx ON public.walks (user_id);
CREATE INDEX IF NOT EXISTS walks_deleted_idx ON public.walks (deleted);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.walks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.walks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
