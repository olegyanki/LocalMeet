/*
  # Add Chat Images Storage

  1. New Storage
    - Create `chat-images` bucket for storing chat images
    - Configure RLS policies for secure access
    
  2. Changes to messages table
    - Add `image_url` field (text, nullable) to store image URLs
    
  3. Security
    - Users can upload images to their own chats
    - Users can view images from chats they participate in
    - Images are publicly accessible once uploaded
*/

-- Add image_url field to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their chats
CREATE POLICY "Users can upload images to their chats"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM chats 
    WHERE requester_id = auth.uid() OR walker_id = auth.uid()
  )
);

-- Allow authenticated users to view images from their chats
CREATE POLICY "Users can view images from their chats"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM chats 
    WHERE requester_id = auth.uid() OR walker_id = auth.uid()
  )
);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their uploaded images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  owner = auth.uid()
);
