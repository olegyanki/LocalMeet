-- Add test events for different users on Koh Phangan
-- IMPORTANT: duration is stored in SECONDS (not minutes!)
-- Formula: minutes * 60 = seconds

-- Clear existing mock events (optional - uncomment if needed)
-- DELETE FROM walks WHERE user_id IN (
--   '99999999-9999-9999-9999-999999999999',
--   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
--   '66666666-6666-6666-6666-666666666666',
--   '44444444-4444-4444-4444-444444444444',
--   '11111111-1111-1111-1111-111111111111'
-- );

INSERT INTO walks (
  user_id,
  title,
  description,
  start_time,
  duration,  -- in SECONDS
  latitude,
  longitude,
  deleted
) VALUES
  -- Events starting soon (10-15 minutes)
  (
    '99999999-9999-9999-9999-999999999999',
    'Ранкова йога на пляжі',
    'Мʼяка йога з видом на море. Всі рівні welcome 🧘‍♀️',
    now() + interval '10 minutes',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7316,
    100.0136,
    false
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Функціональне тренування',
    'Тренування з власною вагою біля океану 💪',
    now() + interval '15 minutes',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7202,
    100.0045,
    false
  ),

  -- Events in 1–2 hours
  (
    '66666666-6666-6666-6666-666666666666',
    'Кава в Sri Thanu',
    'Кава, знайомства і розмови про життя на острові ☕',
    now() + interval '1 hour',
    5400,  -- 90 minutes * 60 = 5400 seconds
    9.7339,
    100.0049,
    false
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Прогулянка джунглями',
    'Легка хайкінг-прогулянка з видами 🌿',
    now() + interval '1.5 hours',
    7200,  -- 120 minutes * 60 = 7200 seconds
    9.7452,
    100.0278,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Біг вздовж моря',
    'Спокійний біг уздовж Haad Yao 🏃‍♂️',
    now() + interval '2 hours',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7214,
    100.0032,
    false
  ),

  -- Events later today (5-9 hours)
  (
    '99999999-9999-9999-9999-999999999999',
    'Смузі-боул та чіл',
    'Зустрічаємось на корисний перекус 🥥',
    now() + interval '5 hours',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7365,
    100.0067,
    false
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Захід сонця в Secret Beach',
    'Дивимось sunset разом 🌅',
    now() + interval '6 hours',
    5400,  -- 90 minutes * 60 = 5400 seconds
    9.7343,
    100.0060,
    false
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Екстатик денс',
    'Вільний рух під електронну музику 💃',
    now() + interval '7 hours',
    7200,  -- 120 minutes * 60 = 7200 seconds
    9.7330,
    100.0041,
    false
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Джем на пляжі',
    'Барабани, гітари і імпровізація 🪘',
    now() + interval '8 hours',
    7200,  -- 120 minutes * 60 = 7200 seconds
    9.7198,
    100.0069,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Нічний маркет Thong Sala',
    'Їжа, фрукти і нічний вайб 🌙',
    now() + interval '9 hours',
    5400,  -- 90 minutes * 60 = 5400 seconds
    9.7160,
    100.0286,
    false
  ),

  -- Events tomorrow (18-26 hours)
  (
    '99999999-9999-9999-9999-999999999999',
    'Сніданок з видом на море',
    'Повільний ранок і гарна компанія 🍳',
    now() + interval '18 hours',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7219,
    100.0058,
    false
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Водоспад Phaeng',
    'Прогулянка до водоспаду і купання 💦',
    now() + interval '20 hours',
    9000,  -- 150 minutes * 60 = 9000 seconds
    9.7426,
    100.0359,
    false
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Тайська кухня вдома',
    'Готуємо просту тайську їжу разом 🍜',
    now() + interval '22 hours',
    7200,  -- 120 minutes * 60 = 7200 seconds
    9.7168,
    100.0312,
    false
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Ранкова медитація',
    'Тиха практика на світанку 🧘‍♂️',
    now() + interval '24 hours',
    3600,  -- 60 minutes * 60 = 3600 seconds
    9.7351,
    100.0063,
    false
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Снорклінг',
    'Досліджуємо підводний світ разом 🤿',
    now() + interval '26 hours',
    7200,  -- 120 minutes * 60 = 7200 seconds
    9.7510,
    100.0448,
    false
  );
