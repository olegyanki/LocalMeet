/*
  # Add Audio Messages Support

  1. Changes
    - Add `audio_url` column to `messages` table to store audio file URLs
    - Add `audio_duration` column to store audio length in seconds
    - Create `audio_messages` storage bucket for audio files
    - Add storage policies for audio uploads and downloads

  2. Security
    - Users can upload audio to their own messages
    - Users can read audio from chats they're part of
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'audio_duration'
  ) THEN
    ALTER TABLE messages ADD COLUMN audio_duration integer;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-messages', 'audio-messages', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload audio messages" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read audio from their chats" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own audio messages" ON storage.objects;
END $$;

CREATE POLICY "Users can upload audio messages"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read audio from their chats"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-messages' AND
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id::text = (storage.foldername(name))[2]
    AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own audio messages"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);