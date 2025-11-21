/*
  # Update Seed Data with Multiple Venues

  This migration updates the sample data to include:
  - 2 distinct theater venues
  - Plays scheduled in different venues
  - Additional performances
  
  Note: This replaces some of the previous seed data
*/

-- Clear existing seed data (be careful in production!)
DELETE FROM play_actors WHERE play_id IN (SELECT id FROM plays WHERE title IN ('Hamlet', 'A Midsummer Night''s Dream', 'The Phantom of the Opera', 'Death of a Salesman'));
DELETE FROM performances WHERE play_id IN (SELECT id FROM plays WHERE title IN ('Hamlet', 'A Midsummer Night''s Dream', 'The Phantom of the Opera', 'Death of a Salesman'));
DELETE FROM seats WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Main Theater Hall', 'Studio Theater'));
DELETE FROM seat_sections WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Main Theater Hall', 'Studio Theater'));
DELETE FROM venues WHERE name IN ('Main Theater Hall', 'Studio Theater');
DELETE FROM plays WHERE title IN ('Hamlet', 'A Midsummer Night''s Dream', 'The Phantom of the Opera', 'Death of a Salesman');
DELETE FROM actors WHERE full_name IN ('Emma Thompson', 'James Morrison', 'Sofia Rodriguez', 'David Chen');

-- Insert venues with Macedonian context
INSERT INTO venues (name, description, address, capacity, is_active) VALUES
  ('Македонски народен театар', 'Главна театарска сала со модерна опрема и одлична акустика', 'ул. Илинденска бр. 1, 1000 Скопје', 200, true),
  ('Театар Комедија', 'Интимна просторија идеална за помали продукции и современи претстави', 'ул. Орце Николов бр. 58, 1000 Скопје', 80, true)
ON CONFLICT DO NOTHING;

-- Get venue IDs
DO $$
DECLARE
  mnt_venue_id uuid;
  comedy_venue_id uuid;
  section_id uuid;
BEGIN
  SELECT id INTO mnt_venue_id FROM venues WHERE name = 'Македонски народен театар' LIMIT 1;
  SELECT id INTO comedy_venue_id FROM venues WHERE name = 'Театар Комедија' LIMIT 1;

  -- Create seat sections for Macedonian National Theater
  INSERT INTO seat_sections (venue_id, name, description, display_order) VALUES
    (mnt_venue_id, 'Партер', 'Главна сала со одличен поглед кон сцената', 1),
    (mnt_venue_id, 'Балкон', 'Издигната позиција со панорамски поглед', 2),
    (mnt_venue_id, 'Ложа', 'Ексклузивни седишта со посебен комфор', 3)
  ON CONFLICT DO NOTHING;

  -- Create seat sections for Comedy Theater
  INSERT INTO seat_sections (venue_id, name, description, display_order) VALUES
    (comedy_venue_id, 'Партер', 'Интимна близина до сцената', 1)
  ON CONFLICT DO NOTHING;

  -- Get section ID for MNT orchestra
  SELECT id INTO section_id FROM seat_sections WHERE venue_id = mnt_venue_id AND name = 'Партер' LIMIT 1;

  -- Create seats for Macedonian National Theater (rows A-J, seats 1-20)
  FOR row_char IN 65..74 LOOP
    FOR seat_num IN 1..20 LOOP
      INSERT INTO seats (venue_id, section_id, row_label, seat_number, is_wheelchair_accessible, is_available)
      VALUES (
        mnt_venue_id,
        section_id,
        chr(row_char),
        seat_num::text,
        (row_char = 65 AND seat_num IN (1, 2, 19, 20)),
        true
      )
      ON CONFLICT (venue_id, row_label, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Get section ID for Comedy Theater
  SELECT id INTO section_id FROM seat_sections WHERE venue_id = comedy_venue_id AND name = 'Партер' LIMIT 1;

  -- Create seats for Comedy Theater (rows A-D, seats 1-20)
  FOR row_char IN 65..68 LOOP
    FOR seat_num IN 1..20 LOOP
      INSERT INTO seats (venue_id, section_id, row_label, seat_number, is_wheelchair_accessible, is_available)
      VALUES (
        comedy_venue_id,
        section_id,
        chr(row_char),
        seat_num::text,
        (row_char = 65 AND seat_num IN (1, 20)),
        true
      )
      ON CONFLICT (venue_id, row_label, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert Macedonian themed plays
INSERT INTO plays (
  title, 
  subtitle, 
  description, 
  genre, 
  duration_minutes, 
  age_rating, 
  director_name, 
  language, 
  poster_url,
  is_featured,
  is_active
) VALUES
  (
    'Турско огледало',
    'Класика на македонската драма',
    'Една од најпознатите македонски драми што ги разгледува темите на идентитетот, традицијата и модерноста. Поставена во времето на турското владеење, претставата ја истражува борбата помеѓу стариот и новиот свет.',
    'Драма',
    150,
    'PG-13',
    'Билјана Петровска',
    'Македонски',
    'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg',
    true,
    true
  ),
  (
    'Балканска шпионка',
    'Трилер со историски контекст',
    'Напната шпиунска приказна поставена во Скопје за време на Студената војна. Преплетени судбини, тајни и интриги во едно време кога секој можел да биде шпион или предавник.',
    'Трилер',
    135,
    'R',
    'Дарко Ангеловски',
    'Македонски',
    'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
    true,
    true
  ),
  (
    'Љубовни приказни од Вардар',
    'Романтична комедија',
    'Весела и топла приказна за љубов во современа Македонија. Преку животите на неколку парови, претставата ги разгледува радостите и предизвиците на љубовта во денешно време.',
    'Комедија',
    120,
    'PG',
    'Елена Николовска',
    'Македонски',
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
    false,
    true
  ),
  (
    'Гоце Делчев: Легенда',
    'Историска драма',
    'Моќна претстава за животот и борбата на македонскиот револуционер Гоце Делчев. Епска приказна за храброст, жртва и борбата за слобода.',
    'Историска',
    180,
    'PG-13',
    'Марко Стојановски',
    'Македонски',
    'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg',
    true,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample performances in different venues
DO $$
DECLARE
  ogledalo_id uuid;
  spionka_id uuid;
  ljubov_id uuid;
  goce_id uuid;
  mnt_venue_id uuid;
  comedy_venue_id uuid;
  current_date_val date := CURRENT_DATE;
BEGIN
  SELECT id INTO ogledalo_id FROM plays WHERE title = 'Турско огледало' LIMIT 1;
  SELECT id INTO spionka_id FROM plays WHERE title = 'Балканска шпионка' LIMIT 1;
  SELECT id INTO ljubov_id FROM plays WHERE title = 'Љубовни приказни од Вардар' LIMIT 1;
  SELECT id INTO goce_id FROM plays WHERE title = 'Гоце Делчев: Легенда' LIMIT 1;
  SELECT id INTO mnt_venue_id FROM venues WHERE name = 'Македонски народен театар' LIMIT 1;
  SELECT id INTO comedy_venue_id FROM venues WHERE name = 'Театар Комедија' LIMIT 1;

  -- Турско огледало performances (Main venue)
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (ogledalo_id, mnt_venue_id, current_date_val + 3, '19:30:00', 300.00, 'scheduled'),
    (ogledalo_id, mnt_venue_id, current_date_val + 4, '19:30:00', 300.00, 'scheduled'),
    (ogledalo_id, mnt_venue_id, current_date_val + 5, '14:00:00', 250.00, 'scheduled'),
    (ogledalo_id, mnt_venue_id, current_date_val + 5, '19:30:00', 300.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Балканска шпионка performances (Main venue)
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (spionka_id, mnt_venue_id, current_date_val + 7, '20:00:00', 350.00, 'scheduled'),
    (spionka_id, mnt_venue_id, current_date_val + 8, '20:00:00', 350.00, 'scheduled'),
    (spionka_id, mnt_venue_id, current_date_val + 9, '20:00:00', 350.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Љубовни приказни од Вардар performances (Comedy Theater)
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (ljubov_id, comedy_venue_id, current_date_val + 2, '19:00:00', 200.00, 'scheduled'),
    (ljubov_id, comedy_venue_id, current_date_val + 3, '19:00:00', 200.00, 'scheduled'),
    (ljubov_id, comedy_venue_id, current_date_val + 4, '14:00:00', 180.00, 'scheduled'),
    (ljubov_id, comedy_venue_id, current_date_val + 4, '19:00:00', 200.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Гоце Делчев: Легенда performances (Main venue)
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (goce_id, mnt_venue_id, current_date_val + 12, '19:30:00', 400.00, 'scheduled'),
    (goce_id, mnt_venue_id, current_date_val + 13, '19:30:00', 400.00, 'scheduled'),
    (goce_id, mnt_venue_id, current_date_val + 14, '14:00:00', 350.00, 'scheduled'),
    (goce_id, mnt_venue_id, current_date_val + 14, '19:30:00', 400.00, 'scheduled')
  ON CONFLICT DO NOTHING;
END $$;

-- Insert Macedonian actors
INSERT INTO actors (full_name, biography, photo_url) VALUES
  (
    'Катерина Коцева',
    'Еминентна македонска актерка со над 25 години искуство. Добитничка на бројни награди за своите улоги во класичните македонски драми.',
    'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'
  ),
  (
    'Никола Ристоски',
    'Еден од најпознатите македонски актери. Познат по своите моќни драматски улоги и карактерна игра.',
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg'
  ),
  (
    'Марија Стојчевска',
    'Млада и талентирана актерка која брзо станува звезда на македонската театарска сцена.',
    'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg'
  ),
  (
    'Дарко Петрески',
    'Разностран актер со импресивна кариера во драма, комедија и трилер.',
    'https://images.pexels.com/photos/1181688/pexels-photo-1181688.jpeg'
  )
ON CONFLICT DO NOTHING;

-- Link actors to plays
DO $$
DECLARE
  ogledalo_id uuid;
  spionka_id uuid;
  ljubov_id uuid;
  goce_id uuid;
  katerina_id uuid;
  nikola_id uuid;
  marija_id uuid;
  darko_id uuid;
BEGIN
  SELECT id INTO ogledalo_id FROM plays WHERE title = 'Турско огледало' LIMIT 1;
  SELECT id INTO spionka_id FROM plays WHERE title = 'Балканска шпионка' LIMIT 1;
  SELECT id INTO ljubov_id FROM plays WHERE title = 'Љубовни приказни од Вардар' LIMIT 1;
  SELECT id INTO goce_id FROM plays WHERE title = 'Гоце Делчев: Легенда' LIMIT 1;
  
  SELECT id INTO katerina_id FROM actors WHERE full_name = 'Катерина Коцева' LIMIT 1;
  SELECT id INTO nikola_id FROM actors WHERE full_name = 'Никола Ристоски' LIMIT 1;
  SELECT id INTO marija_id FROM actors WHERE full_name = 'Марија Стојчевска' LIMIT 1;
  SELECT id INTO darko_id FROM actors WHERE full_name = 'Дарко Петрески' LIMIT 1;

  -- Турско огледало cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (ogledalo_id, katerina_id, 'Мара', 1),
    (ogledalo_id, nikola_id, 'Стојан', 2),
    (ogledalo_id, darko_id, 'Турчинот', 3)
  ON CONFLICT DO NOTHING;

  -- Балканска шпионка cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (spionka_id, marija_id, 'Ана', 1),
    (spionka_id, darko_id, 'Агент Крстески', 2),
    (spionka_id, nikola_id, 'Генералот', 3)
  ON CONFLICT DO NOTHING;

  -- Љубовни приказни од Вардар cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (ljubov_id, marija_id, 'Елена', 1),
    (ljubov_id, darko_id, 'Марко', 2),
    (ljubov_id, katerina_id, 'Баба Стана', 3)
  ON CONFLICT DO NOTHING;

  -- Гоце Делчев: Легенда cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (goce_id, nikola_id, 'Гоце Делчев', 1),
    (goce_id, katerina_id, 'Султана', 2),
    (goce_id, darko_id, 'Даме Груев', 3)
  ON CONFLICT DO NOTHING;
END $$;
