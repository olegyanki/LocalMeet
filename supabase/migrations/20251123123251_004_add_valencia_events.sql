/*
  # Add Valencia Test Users with Events

  1. Test Data
    - Creates 5 more test users in Valencia city center
    - Adds locations around Plaza del Ayuntamiento (39.4699, -0.3763)
    - Each user has an interesting activity/event status
    
  2. Notes
    - Demo profiles for testing location-based features
    - Located in Valencia, Spain
*/

DO $$ 
DECLARE
  user6_id uuid := '66666666-6666-6666-6666-666666666666';
  user7_id uuid := '77777777-7777-7777-7777-777777777777';
  user8_id uuid := '88888888-8888-8888-8888-888888888888';
  user9_id uuid := '99999999-9999-9999-9999-999999999999';
  user10_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
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
    (user6_id, '00000000-0000-0000-0000-000000000000', 'carlos@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user7_id, '00000000-0000-0000-0000-000000000000', 'lucia@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user8_id, '00000000-0000-0000-0000-000000000000', 'miguel@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user9_id, '00000000-0000-0000-0000-000000000000', 'sofia@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
    (user10_id, '00000000-0000-0000-0000-000000000000', 'pablo@demo.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles with Valencia-themed activities
  INSERT INTO profiles (id, username, display_name, bio, status, is_visible)
  VALUES 
    (user6_id, 'carlos_vlc', 'Carlos', 'Paella master і local guide', 'Готую паелью на пляжі Malvarrosa! Приєднуйтесь, є вино і хороша компанія 🥘🍷', true),
    (user7_id, 'lucia_vlc', 'Lucía', 'Танцівниця фламенко', 'Фламенко в Jardines del Turia о 19:00. Новачки welcome! 💃', true),
    (user8_id, 'miguel_vlc', 'Miguel', 'Архітектор, фанат Калатрави', 'Фото-тур по Ciudad de las Artes. Розкажу про архітектуру! 📸', true),
    (user9_id, 'sofia_vlc', 'Sofía', 'Бариста та coffee lover', 'Кава у Mercat Central, потім walk по старому місту. Хто зі мною? ☕', true),
    (user10_id, 'pablo_vlc', 'Pablo', 'Сьорфер та beach volleyball player', 'Волейбол на пляжі Las Arenas! Треба ще 2 людини для команди 🏐', true)
  ON CONFLICT (username) DO NOTHING;

  -- Insert locations around Valencia city center (Plaza del Ayuntamiento: 39.4699, -0.3763)
  INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
  VALUES 
    (user6_id, 39.4749, -0.3313, now()),  -- Malvarrosa beach area
    (user7_id, 39.4769, -0.3663, now()),  -- Jardines del Turia
    (user8_id, 39.4546, -0.3499, now()),  -- Ciudad de las Artes area
    (user9_id, 39.4738, -0.3784, now()),  -- Mercat Central
    (user10_id, 39.4709, -0.3263, now())  -- Las Arenas beach
  ON CONFLICT DO NOTHING;
END $$;
