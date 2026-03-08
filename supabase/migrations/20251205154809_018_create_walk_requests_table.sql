-- Create walk_requests table (join requests for walks)
CREATE TABLE IF NOT EXISTS public.walk_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id UUID NOT NULL REFERENCES public.walks(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.walk_requests ENABLE ROW LEVEL SECURITY;

-- Walk requests policies
CREATE POLICY "Walk requests are viewable by walk owner and requester"
  ON public.walk_requests FOR SELECT
  USING (
    auth.uid() = requester_id OR
    auth.uid() IN (SELECT user_id FROM public.walks WHERE id = walk_id)
  );

CREATE POLICY "Users can create walk requests"
  ON public.walk_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Walk owners can update requests"
  ON public.walk_requests FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.walks WHERE id = walk_id)
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS walk_requests_walk_id_idx ON public.walk_requests (walk_id);
CREATE INDEX IF NOT EXISTS walk_requests_requester_id_idx ON public.walk_requests (requester_id);
CREATE INDEX IF NOT EXISTS walk_requests_status_idx ON public.walk_requests (status);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.walk_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.walk_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
