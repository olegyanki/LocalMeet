/*
  # Add Mock Walks/Events
  
  1. New Data
    - Create various mock walks/events in Valencia
    - Different locations, times, and types of activities
    - Assigned to existing test users
    
  2. Event Types
    - Morning walks in parks
    - Beach activities
    - Cultural tours
    - Coffee meetups
    - Sports activities
    
  3. Notes
    - All events are set to active
    - Times are set to near future for realistic testing
    - Coordinates are real Valencia locations
*/

-- Insert mock walks for various Valencia locations
INSERT INTO walks (user_id, title, description, start_time, duration, latitude, longitude, is_active) VALUES
  -- Sofia's yoga walk in Turia Gardens
  (
    '99999999-9999-9999-9999-999999999999',
    'Ранкова йога в Turia Gardens',
    'Приєднуйтесь до ранкової йога-сесії серед зелених алей! Беріть килимки та хороший настрій. Підходить для всіх рівнів 🧘‍♀️',
    now() + interval '2 hours',
    '1 година',
    39.4766982,
    -0.3570778,
    true
  ),
  
  -- Pablo's volleyball game
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Волейбол на пляжі Las Arenas',
    'Граємо волейбол на пляжі! Треба ще пару людей для команди. Після гри можна посидіти в чирінгіто 🏐',
    now() + interval '4 hours',
    '2 години',
    39.4691356,
    -0.3264946,
    true
  ),
  
  -- Carlos paella cooking
  (
    '66666666-6666-6666-6666-666666666666',
    'Кулінарний майстер-клас: Паелья',
    'Готуємо автентичну валенсійську паелью біля пляжу! Розкажу всі секрети та дам куштувати. Вино included 🥘🍷',
    now() + interval '5 hours',
    '3 години',
    39.4724034,
    -0.3255293,
    true
  ),
  
  -- Dmytro's guitar session
  (
    '44444444-4444-4444-4444-444444444444',
    'Акустична сесія в Barrio del Carmen',
    'Граю гітару в старому місті. Приєднуйтесь послухати або підспівати. Можемо попити sangria після 🎸',
    now() + interval '3 hours',
    '2 години',
    39.4800537,
    -0.3789991,
    true
  ),
  
  -- Maksym's running
  (
    '11111111-1111-1111-1111-111111111111',
    'Ранкова пробіжка вздовж пляжу',
    'Біжу 5км вздовж Malvarrosa. Темп середній, підходить для всіх. Після можна на каву ☕🏃',
    now() + interval '1 hour',
    '45 хвилин',
    39.4748943,
    -0.3298076,
    true
  ),
  
  -- Sofia's book club
  (
    '99999999-9999-9999-9999-999999999999',
    'Книжковий клуб у ботанічному саду',
    'Обговорюємо останні прочитані книги в затишній атмосфері саду. Беріть улюблену книгу! 📚',
    now() + interval '1 day',
    '1.5 години',
    39.4765833,
    -0.3823056,
    true
  ),
  
  -- Pablo's networking event
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Tech meetup в Ciudad de las Artes',
    'Нетворкінг для IT-підприємців та стартаперів. Обмінюємось ідеями та досвідом 💡',
    now() + interval '1 day' + interval '3 hours',
    '2 години',
    39.4569562,
    -0.3515789,
    true
  ),
  
  -- Carlos's food tour
  (
    '66666666-6666-6666-6666-666666666666',
    'Гастротур: Mercado Central',
    'Показую найкращі місця на центральному ринку. Куштуємо хамон, сири, морепродукти 🦐🧀',
    now() + interval '6 hours',
    '2 години',
    39.4739839,
    -0.3786667,
    true
  ),
  
  -- Dmytro's jam session
  (
    '44444444-4444-4444-4444-444444444444',
    'Джем-сейшн для музикантів',
    'Беріть інструменти та приєднуйтесь! Граємо джаз та блюз. Новачкам теж welcome 🎵',
    now() + interval '1 day' + interval '5 hours',
    '3 години',
    39.4699075,
    -0.3762881,
    true
  ),
  
  -- Maksym's cycling tour
  (
    '11111111-1111-1111-1111-111111111111',
    'Велопрогулянка парком Turia',
    'Їдемо через весь парк від початку до кінця. Середній темп, є зупинки для фото 🚴‍♂️',
    now() + interval '1 day' + interval '2 hours',
    '2 години',
    39.4792607,
    -0.3579937,
    true
  ),
  
  -- Sofia's sunset walk
  (
    '99999999-9999-9999-9999-999999999999',
    'Захід сонця на пляжі',
    'Милуємось заходом сонця на Malvarrosa. Романтична прогулянка вздовж моря 🌅',
    now() + interval '7 hours',
    '1 година',
    39.4789012,
    -0.3234567,
    true
  ),
  
  -- Pablo's guitar lessons
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Безкоштовні уроки гітари',
    'Викладаю основи гри на гітарі для початківців. Беріть свою гітару або можна на моїй спробувати 🎸',
    now() + interval '2 days',
    '1.5 години',
    39.4801234,
    -0.3654321,
    true
  );
