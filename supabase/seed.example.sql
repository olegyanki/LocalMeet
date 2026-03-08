-- Example seed data for testing
-- Copy this file to seed.sql and customize for your needs

-- Note: This assumes you have test users created in auth.users
-- You can create test users through Supabase Dashboard or Auth API

-- Example user IDs (replace with your actual test user IDs)
-- User 1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- User 2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
-- User 3: 'cccccccc-cccc-cccc-cccc-cccccccccccc'

-- Insert test profiles
INSERT INTO public.profiles (id, username, display_name, bio, age, gender, languages, interests, status)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'john_doe',
    'John Doe',
    'Love exploring new places and meeting new people!',
    28,
    'male',
    ARRAY['English', 'Spanish'],
    ARRAY['Coffee', 'Walking', 'Photography'],
    'Looking for walking buddies'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'jane_smith',
    'Jane Smith',
    'Photographer and coffee enthusiast ☕📸',
    25,
    'female',
    ARRAY['English', 'French'],
    ARRAY['Coffee', 'Art', 'Photography', 'Music'],
    'Always up for a coffee walk'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'alex_garcia',
    'Alex Garcia',
    'Tech enthusiast and nature lover 🌲',
    30,
    'non-binary',
    ARRAY['English', 'Spanish', 'Catalan'],
    ARRAY['Technology', 'Hiking', 'Coffee', 'Books'],
    'Looking for hiking partners'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test walks (Valencia, Spain coordinates)
INSERT INTO public.walks (user_id, title, start_time, duration, description, latitude, longitude)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Morning Coffee Walk',
    NOW() + INTERVAL '2 hours',
    3600, -- 1 hour in seconds
    'Let''s grab coffee and walk around the old town!',
    39.4699, -- Valencia latitude
    -0.3763  -- Valencia longitude
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Photography Walk',
    NOW() + INTERVAL '1 day',
    7200, -- 2 hours
    'Exploring the city with cameras. All skill levels welcome!',
    39.4750,
    -0.3700
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Beach Sunset Walk',
    NOW() + INTERVAL '5 hours',
    5400, -- 1.5 hours
    'Watching the sunset at Malvarrosa beach 🌅',
    39.4800,
    -0.3200
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Park Jogging',
    NOW() + INTERVAL '3 days',
    3600,
    'Light jogging in Turia Gardens. Beginners welcome!',
    39.4650,
    -0.3650
  )
ON CONFLICT DO NOTHING;

-- Insert test walk request
INSERT INTO public.walk_requests (walk_id, requester_id, message, status)
SELECT 
  w.id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Hi! I''d love to join your coffee walk. I know a great café nearby!',
  'pending'
FROM public.walks w
WHERE w.title = 'Morning Coffee Walk'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert test chat (after accepting a request)
-- Note: In production, chats are created automatically when requests are accepted
INSERT INTO public.chats (requester_id, walker_id, walk_request_id)
SELECT 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  wr.id
FROM public.walk_requests wr
WHERE wr.requester_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert test messages
INSERT INTO public.messages (chat_id, sender_id, content)
SELECT 
  c.id,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Hey! Thanks for accepting my request!'
FROM public.chats c
WHERE c.requester_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.messages (chat_id, sender_id, content)
SELECT 
  c.id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'No problem! Looking forward to it. Meet at Plaza de la Virgen?'
FROM public.chats c
WHERE c.requester_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Profiles created:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'Walks created:' as info, COUNT(*) as count FROM public.walks;
SELECT 'Walk requests created:' as info, COUNT(*) as count FROM public.walk_requests;
SELECT 'Chats created:' as info, COUNT(*) as count FROM public.chats;
SELECT 'Messages created:' as info, COUNT(*) as count FROM public.messages;
