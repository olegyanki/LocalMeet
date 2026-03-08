-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_request_id UUID REFERENCES public.walk_requests(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  walker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Chats policies
CREATE POLICY "Chats are viewable by participants"
  ON public.chats FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = walker_id);

CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = walker_id);

CREATE POLICY "Participants can delete chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = walker_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  audio_duration INTEGER,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Messages are viewable by chat participants"
  ON public.messages FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM public.chats 
      WHERE requester_id = auth.uid() OR walker_id = auth.uid()
    )
  );

CREATE POLICY "Chat participants can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    chat_id IN (
      SELECT id FROM public.chats 
      WHERE requester_id = auth.uid() OR walker_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS chats_requester_id_idx ON public.chats (requester_id);
CREATE INDEX IF NOT EXISTS chats_walker_id_idx ON public.chats (walker_id);
CREATE INDEX IF NOT EXISTS chats_walk_request_id_idx ON public.chats (walk_request_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages (chat_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at DESC);

-- Add trigger for chats updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.chats;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
