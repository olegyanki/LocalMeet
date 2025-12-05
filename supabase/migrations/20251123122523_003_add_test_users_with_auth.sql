/*
  # Add Test Users with Auth for Demo

  1. Test Data
    - Creates auth users first
    - Then creates profiles and locations
    - Uses fixed UUIDs for consistency
    
  2. Security
    - These are demo users with weak passwords
    - For testing purposes only
*/

DO $$ 
DECLARE
  user1_id uuid := '11111111-1111-1111-1111-111111111111';
  user2_id uuid := '22222222-2222-2222-2222-222222222222';
  user3_id uuid := '33333333-3333-3333-3333-333333333333';
  user4_id uuid := '44444444-4444-4444-4444-444444444444';
  user5_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Create auth users
  INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
  )
  VALUES 
    (user1_id, '00000000-0000-0000-0000-000000000000', 'maksym@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'andriy@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user3_id, '00000000-0000-0000-0000-000000000000', 'olena@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user4_id, '00000000-0000-0000-0000-000000000000', 'dmytro@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user5_id, '00000000-0000-0000-0000-000000000000', 'maria@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles
  INSERT INTO profiles (id, username, display_name, bio, status, is_visible)
  VALUES 
    (user1_id, 'maksym_demo', 'Максим', 'Люблю активний відпочинок та нові знайомства', 'Іду в парк на пікнік. Не проти послухатись, попити чайка. Приїхав з Балі місяць тому, можу поділитись досвідом. Не проти після в бар сходити.', true),
    (user2_id, 'andriy_demo', 'Андрій', 'Фанат волейболу та музики', 'На пляжу граєм волейбольчик вечором, слухаєм музичку 🏐. Запитайте)', true),
    (user3_id, 'olena_demo', 'Олена', 'Фотограф-аматор, люблю прогулянки', 'Йду фотографувати закат біля річки. Шукаю компанію для творчості!', true),
    (user4_id, 'dmytro_demo', 'Дмитро', 'Гітарист, обожнюю кави та розмови', 'Сиджу в кав''ярні з гітарою. Хто хоче послухати живу музику?', true),
    (user5_id, 'maria_demo', 'Марія', 'Йога-ентузіаст', 'Ранкова практика йоги в парку. Вітаються новачки! 🧘', true)
  ON CONFLICT (username) DO NOTHING;

  -- Insert locations for test users (around Kyiv center: 50.4501, 30.5234)
  INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
  VALUES 
    (user1_id, 50.4551, 30.5284, now()),
    (user2_id, 50.4481, 30.5334, now()),
    (user3_id, 50.4521, 30.5184, now()),
    (user4_id, 50.4461, 30.5254, now()),
    (user5_id, 50.4541, 30.5204, now())
  ON CONFLICT DO NOTHING;
END $$;
