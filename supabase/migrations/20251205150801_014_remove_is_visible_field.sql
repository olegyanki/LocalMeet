/*
  # Видалення поля is_visible з таблиці profiles

  1. Зміни
    - Видалення колонки `is_visible` з таблиці `profiles`
  
  2. Причина
    - Поле більше не використовується в додатку
*/

ALTER TABLE profiles DROP COLUMN IF EXISTS is_visible;