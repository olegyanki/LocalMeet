-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('event-images', 'event-images', true),
  ('chat-images', 'chat-images', true),
  ('chat-audio', 'chat-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for event-images
CREATE POLICY "Event images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for chat-images
CREATE POLICY "Chat images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for chat-audio
CREATE POLICY "Chat audio are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-audio');

CREATE POLICY "Authenticated users can upload chat audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-audio' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own chat audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-audio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
