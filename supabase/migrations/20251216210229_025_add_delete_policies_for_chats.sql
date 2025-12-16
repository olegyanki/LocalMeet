/*
  # Add Delete Policies for Chats and Messages

  1. Changes
    - Add DELETE policy for messages table
    - Add DELETE policy for chats table
    
  2. Security
    - Users can delete messages they sent in their chats
    - Users can delete chats where they are participants (requester or walker)
*/

-- Allow users to delete messages they sent
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND (chats.requester_id = auth.uid() OR chats.walker_id = auth.uid())
    )
  );

-- Allow users to delete chats where they are participants
CREATE POLICY "Users can delete chats they participate in"
  ON chats FOR DELETE
  TO authenticated
  USING (
    auth.uid() = requester_id OR auth.uid() = walker_id
  );