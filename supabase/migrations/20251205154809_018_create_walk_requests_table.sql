/*
  # Create walk requests table

  1. New Tables
    - `walk_requests`
      - `id` (uuid, primary key)
      - `walk_id` (uuid, references walks)
      - `requester_id` (uuid, references profiles)
      - `message` (text) - initial message from requester
      - `status` (text) - 'pending', 'accepted', 'rejected'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `walk_requests` table
    - Users can create their own requests
    - Users can view requests they created
    - Walk owners can view requests for their walks
    - Walk owners can update request status
*/

CREATE TABLE IF NOT EXISTS walk_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id uuid NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_walk_requests_walk_id ON walk_requests(walk_id);
CREATE INDEX IF NOT EXISTS idx_walk_requests_requester_id ON walk_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_walk_requests_status ON walk_requests(status);

-- Enable RLS
ALTER TABLE walk_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can create walk requests"
  ON walk_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON walk_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id);

-- Walk owners can view requests for their walks
CREATE POLICY "Walk owners can view requests for their walks"
  ON walk_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM walks
      WHERE walks.id = walk_requests.walk_id
      AND walks.user_id = auth.uid()
    )
  );

-- Walk owners can update request status
CREATE POLICY "Walk owners can update request status"
  ON walk_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM walks
      WHERE walks.id = walk_requests.walk_id
      AND walks.user_id = auth.uid()
    )
  )
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_walk_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_walk_requests_updated_at_trigger
  BEFORE UPDATE ON walk_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_walk_requests_updated_at();
