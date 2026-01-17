/*
  # Add More Test Walks
  
  Add multiple walks for different users at various locations in Valencia
  to test multiple events per user functionality
*/

-- Add more walks with different locations
INSERT INTO walks (user_id, title, description, start_time, duration, latitude, longitude) VALUES
  -- Multiple walks for Sofia
  (
    '99999999-9999-9999-9999-999999999999',
    'Кава в Russafa',
    'Пʼємо каву в модному районі Russafa. Обговорюємо мистецтво та культуру ☕',
    now() + interval '30 minutes',
    '1 година',
    39.4650000,
    -0.3700000,
    true
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'Вечірня прогулянка в порту',
    'Гуляємо вечірнім портом, дивимось на яхти. Можна зайти в ресторан після 🚢',
    now() + interval '8 hours',
    '2 години',
    39.4550000,
    -0.3300000,
    true
  ),
  
  -- Multiple walks for Pablo
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Футбол в парку',
    'Граємо футбол в парку Benicalap. Треба ще гравців! ⚽',
    now() + interval '1 hour',
    '1.5 години',
    39.4900000,
    -0.3900000,
    true
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Пікнік біля озера',
    'Організовую пікнік біля озера в Turia. Беріть їжу та напої 🧺',
    now() + interval '6 hours',
    '3 години',
    39.4800000,
    -0.3600000,
    true
  ),
  
  -- Multiple walks for Carlos
  (
    '66666666-6666-6666-6666-666666666666',
    'Тапас-тур по центру',
    'Йдемо по барах центру, куштуємо тапас. Покажу найкращі місця! 🍤',
    now() + interval '2 hours',
    '2 години',
    39.4750000,
    -0.3750000,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Майстер-клас з коктейлів',
    'Вчу робити класичні іспанські коктейлі. Sangria, mojito та інші 🍹',
    now() + interval '9 hours',
    '2 години',
    39.4720000,
    -0.3680000,
    true
  ),
  
  -- Multiple walks for Dmytro
  (
    '44444444-4444-4444-4444-444444444444',
    'Фотопрогулянка старим містом',
    'Фотографуємо архітектуру та вулички Carmen. Беріть камери! 📸',
    now() + interval '45 minutes',
    '2 години',
    39.4810000,
    -0.3790000,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Концерт на вулиці',
    'Граю на вулиці біля Mercado Central. Приходьте послухати 🎵',
    now() + interval '7 hours',
    '1.5 години',
    39.4740000,
    -0.3785000,
    true
  ),
  
  -- Multiple walks for Maksym
  (
    '11111111-1111-1111-1111-111111111111',
    'Тренування в парку',
    'Workout на свіжому повітрі. Турніки, віджимання, присідання 💪',
    now() + interval '20 minutes',
    '1 година',
    39.4770000,
    -0.3560000,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Баскетбол на майданчику',
    'Граємо баскетбол 3x3. Треба ще пару людей 🏀',
    now() + interval '5 hours',
    '1.5 години',
    39.4850000,
    -0.3650000,
    true
  );
