/*
  # Seed Sample Data for Theater Booking System

  This migration adds sample data for demonstration purposes:
  
  1. Sample Venues
    - Main Theater Hall
    - Studio Theater
  
  2. Sample Seats
    - Creates seating layout for Main Theater Hall (rows A-E, seats 1-10)
  
  3. Sample Plays
    - Hamlet
    - A Midsummer Night's Dream
    - The Phantom of the Opera
  
  4. Sample Performances
    - Multiple upcoming performances for each play
  
  Note: This is demo data and should be modified or removed for production use.
*/

-- Insert sample venues
INSERT INTO venues (name, description, address, capacity, is_active) VALUES
  ('Main Theater Hall', 'Our premier venue with state-of-the-art acoustics and comfortable seating', '123 Theater Street, New York, NY 10001', 50, true),
  ('Studio Theater', 'Intimate performance space perfect for smaller productions', '123 Theater Street, Suite 200, New York, NY 10001', 30, true)
ON CONFLICT DO NOTHING;

-- Get venue IDs for reference
DO $$
DECLARE
  main_venue_id uuid;
  studio_venue_id uuid;
  section_id uuid;
BEGIN
  SELECT id INTO main_venue_id FROM venues WHERE name = 'Main Theater Hall' LIMIT 1;
  SELECT id INTO studio_venue_id FROM venues WHERE name = 'Studio Theater' LIMIT 1;

  -- Create seat sections for main venue
  INSERT INTO seat_sections (venue_id, name, description, display_order) VALUES
    (main_venue_id, 'Orchestra', 'Main floor seating with excellent views', 1),
    (main_venue_id, 'Balcony', 'Elevated seating with panoramic views', 2)
  ON CONFLICT DO NOTHING;

  -- Get section ID for orchestra
  SELECT id INTO section_id FROM seat_sections WHERE venue_id = main_venue_id AND name = 'Orchestra' LIMIT 1;

  -- Create seats for main venue (rows A-E, seats 1-10)
  FOR row_char IN 65..69 LOOP -- ASCII for A-E
    FOR seat_num IN 1..10 LOOP
      INSERT INTO seats (venue_id, section_id, row_label, seat_number, is_wheelchair_accessible, is_available)
      VALUES (
        main_venue_id,
        section_id,
        chr(row_char),
        seat_num::text,
        (row_char = 65 AND seat_num IN (1, 10)), -- First and last seats in row A are wheelchair accessible
        true
      )
      ON CONFLICT (venue_id, row_label, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample plays
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
    'Hamlet',
    'Prince of Denmark',
    'The Tragedy of Hamlet, Prince of Denmark, is a masterpiece that explores themes of revenge, madness, and mortality. This timeless classic follows Prince Hamlet as he seeks to avenge his father''s murder.',
    'Tragedy',
    180,
    'PG-13',
    'Sarah Johnson',
    'English',
    'https://images.pexels.com/photos/3137890/pexels-photo-3137890.jpeg',
    true,
    true
  ),
  (
    'A Midsummer Night''s Dream',
    'Shakespeare''s Enchanted Comedy',
    'A delightful comedy of love, magic, and mischief set in an enchanted forest. Four lovers find themselves entangled in the fairy realm where Puck''s magical interventions lead to hilarious consequences.',
    'Comedy',
    150,
    'G',
    'Michael Chen',
    'English',
    'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
    true,
    true
  ),
  (
    'The Phantom of the Opera',
    'A Haunting Tale of Love and Mystery',
    'In the Paris Opera House, a mysterious masked figure haunts the shadows, captivated by the beautiful soprano Christine. A gothic romance filled with passion, jealousy, and unforgettable music.',
    'Musical',
    165,
    'PG',
    'Robert Martinez',
    'English',
    'https://images.pexels.com/photos/3137076/pexels-photo-3137076.jpeg',
    false,
    true
  ),
  (
    'Death of a Salesman',
    'Arthur Miller''s Pulitzer Prize Winner',
    'Willy Loman, a traveling salesman, confronts the harsh realities of the American Dream. This powerful drama examines family dynamics, disappointment, and the pursuit of success.',
    'Drama',
    135,
    'PG-13',
    'Jennifer Williams',
    'English',
    'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg',
    false,
    true
  )
ON CONFLICT DO NOTHING;

-- Insert sample performances (upcoming dates)
DO $$
DECLARE
  hamlet_id uuid;
  midsummer_id uuid;
  phantom_id uuid;
  salesman_id uuid;
  main_venue_id uuid;
  current_date_val date := CURRENT_DATE;
BEGIN
  SELECT id INTO hamlet_id FROM plays WHERE title = 'Hamlet' LIMIT 1;
  SELECT id INTO midsummer_id FROM plays WHERE title = 'A Midsummer Night''s Dream' LIMIT 1;
  SELECT id INTO phantom_id FROM plays WHERE title = 'The Phantom of the Opera' LIMIT 1;
  SELECT id INTO salesman_id FROM plays WHERE title = 'Death of a Salesman' LIMIT 1;
  SELECT id INTO main_venue_id FROM venues WHERE name = 'Main Theater Hall' LIMIT 1;

  -- Hamlet performances
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (hamlet_id, main_venue_id, current_date_val + 5, '19:00:00', 45.00, 'scheduled'),
    (hamlet_id, main_venue_id, current_date_val + 6, '19:00:00', 45.00, 'scheduled'),
    (hamlet_id, main_venue_id, current_date_val + 7, '14:00:00', 40.00, 'scheduled'),
    (hamlet_id, main_venue_id, current_date_val + 7, '19:00:00', 45.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Midsummer performances
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (midsummer_id, main_venue_id, current_date_val + 3, '19:00:00', 35.00, 'scheduled'),
    (midsummer_id, main_venue_id, current_date_val + 4, '14:00:00', 30.00, 'scheduled'),
    (midsummer_id, main_venue_id, current_date_val + 4, '19:00:00', 35.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Phantom performances
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (phantom_id, main_venue_id, current_date_val + 10, '19:30:00', 55.00, 'scheduled'),
    (phantom_id, main_venue_id, current_date_val + 11, '19:30:00', 55.00, 'scheduled'),
    (phantom_id, main_venue_id, current_date_val + 12, '14:00:00', 50.00, 'scheduled')
  ON CONFLICT DO NOTHING;

  -- Death of a Salesman performances
  INSERT INTO performances (play_id, venue_id, performance_date, performance_time, base_price, status)
  VALUES
    (salesman_id, main_venue_id, current_date_val + 15, '19:00:00', 40.00, 'scheduled'),
    (salesman_id, main_venue_id, current_date_val + 16, '19:00:00', 40.00, 'scheduled')
  ON CONFLICT DO NOTHING;
END $$;

-- Insert sample actors
INSERT INTO actors (full_name, biography, photo_url) VALUES
  (
    'Emma Thompson',
    'Award-winning actress with over 20 years of theater experience. Known for her powerful portrayals of Shakespearean heroines.',
    'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg'
  ),
  (
    'James Morrison',
    'Classically trained actor specializing in dramatic roles. Graduate of the Royal Academy of Dramatic Art.',
    'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg'
  ),
  (
    'Sofia Rodriguez',
    'Rising star in musical theater with a captivating soprano voice. Recent graduate from Juilliard School.',
    'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg'
  ),
  (
    'David Chen',
    'Versatile performer comfortable in both comedic and dramatic roles. Has performed in over 50 productions.',
    'https://images.pexels.com/photos/1181688/pexels-photo-1181688.jpeg'
  )
ON CONFLICT DO NOTHING;

-- Link actors to plays
DO $$
DECLARE
  hamlet_id uuid;
  midsummer_id uuid;
  phantom_id uuid;
  emma_id uuid;
  james_id uuid;
  sofia_id uuid;
  david_id uuid;
BEGIN
  SELECT id INTO hamlet_id FROM plays WHERE title = 'Hamlet' LIMIT 1;
  SELECT id INTO midsummer_id FROM plays WHERE title = 'A Midsummer Night''s Dream' LIMIT 1;
  SELECT id INTO phantom_id FROM plays WHERE title = 'The Phantom of the Opera' LIMIT 1;
  
  SELECT id INTO emma_id FROM actors WHERE full_name = 'Emma Thompson' LIMIT 1;
  SELECT id INTO james_id FROM actors WHERE full_name = 'James Morrison' LIMIT 1;
  SELECT id INTO sofia_id FROM actors WHERE full_name = 'Sofia Rodriguez' LIMIT 1;
  SELECT id INTO david_id FROM actors WHERE full_name = 'David Chen' LIMIT 1;

  -- Hamlet cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (hamlet_id, james_id, 'Hamlet', 1),
    (hamlet_id, emma_id, 'Gertrude', 2),
    (hamlet_id, david_id, 'Claudius', 3)
  ON CONFLICT DO NOTHING;

  -- Midsummer cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (midsummer_id, emma_id, 'Titania', 1),
    (midsummer_id, david_id, 'Oberon', 2),
    (midsummer_id, sofia_id, 'Hermia', 3)
  ON CONFLICT DO NOTHING;

  -- Phantom cast
  INSERT INTO play_actors (play_id, actor_id, role_name, billing_order) VALUES
    (phantom_id, sofia_id, 'Christine Daaé', 1),
    (phantom_id, james_id, 'The Phantom', 2),
    (phantom_id, david_id, 'Raoul', 3)
  ON CONFLICT DO NOTHING;
END $$;
