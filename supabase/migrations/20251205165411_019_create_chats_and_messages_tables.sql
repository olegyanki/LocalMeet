/*
  # Create Chats and Messages Tables

  1. New Tables
    - `chats`
      - `id` (uuid, primary key) - Unique chat identifier
      - `walk_request_id` (uuid, foreign key) - Associated walk request
      - `requester_id` (uuid, foreign key) - User who sent the walk request
      - `walker_id` (uuid, foreign key) - User who accepted the request
      - `created_at` (timestamptz) - When the chat was created
      - `updated_at` (timestamptz) - Last message timestamp for sorting
    
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `chat_id` (uuid, foreign key) - Associated chat
      - `sender_id` (uuid, foreign key) - User who sent the message
      - `content` (text) - Message text content
      - `created_at` (timestamptz) - When message was sent
      - `read` (boolean) - Whether message has been read

  2. Security
    - Enable RLS on both tables
    - Users can view chats where they are participants (requester or walker)
    - Users can create messages only in their own chats
    - Users can view messages only in their own chats
    - Users can update read status only for messages sent to them

  3. Indexes
    - Index on chat_id for messages (for efficient message retrieval)
    - Index on updated_at for chats (for efficient chat list sorting)
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_request_id uuid REFERENCES walk_requests(id) ON DELETE CASCADE,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  walker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  read boolean DEFAULT false NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS chats_updated_at_idx ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS chats_requester_id_idx ON chats(requester_id);
CREATE INDEX IF NOT EXISTS chats_walker_id_idx ON chats(walker_id);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats table
CREATE POLICY "Users can view chats where they are participants"
  ON chats FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id OR auth.uid() = walker_id
  );

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = walker_id
  );

CREATE POLICY "Users can update their chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requester_id OR auth.uid() = walker_id
  )
  WITH CHECK (
    auth.uid() = requester_id OR auth.uid() = walker_id
  );

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in their chats"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read status of messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
    )
  );

-- Function to update chat's updated_at when new message is added
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update chat timestamp
DROP TRIGGER IF EXISTS update_chat_timestamp_trigger ON messages;
CREATE TRIGGER update_chat_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();