/*
  # Allow Public Access to Plays and Performances

  1. Changes
    - Update RLS policies to allow unauthenticated users to view plays
    - Allow public access to performances data
    - Allow public access to venues data
    - Allow public access to actors and play_actors data
    - Keep booking and ticket data restricted to authenticated users

  2. Security
    - Plays, performances, venues, and actors are public for browsing
    - Booking functionality requires authentication
    - Admin functions remain restricted
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active plays" ON plays;
DROP POLICY IF EXISTS "Anyone can view scheduled performances" ON performances;
DROP POLICY IF EXISTS "Anyone can view active venues" ON venues;
DROP POLICY IF EXISTS "Anyone can view seat sections" ON seat_sections;
DROP POLICY IF EXISTS "Anyone can view seats" ON seats;
DROP POLICY IF EXISTS "Anyone can view actors" ON actors;
DROP POLICY IF EXISTS "Anyone can view play actors" ON play_actors;

-- Create public read policies for plays
CREATE POLICY "Public can view active plays"
  ON plays FOR SELECT
  TO public
  USING (is_active = true);

-- Create public read policies for performances
CREATE POLICY "Public can view scheduled performances"
  ON performances FOR SELECT
  TO public
  USING (status IN ('scheduled', 'sold_out'));

-- Create public read policies for venues
CREATE POLICY "Public can view active venues"
  ON venues FOR SELECT
  TO public
  USING (is_active = true);

-- Create public read policies for seat sections
CREATE POLICY "Public can view seat sections"
  ON seat_sections FOR SELECT
  TO public
  USING (true);

-- Create public read policies for seats
CREATE POLICY "Public can view available seats"
  ON seats FOR SELECT
  TO public
  USING (is_available = true);

-- Create public read policies for actors
CREATE POLICY "Public can view actors"
  ON actors FOR SELECT
  TO public
  USING (true);

-- Create public read policies for play_actors
CREATE POLICY "Public can view play actors"
  ON play_actors FOR SELECT
  TO public
  USING (true);

-- Cart reservations should still be accessible to check seat availability
DROP POLICY IF EXISTS "Anyone can view cart reservations" ON cart_reservations;
CREATE POLICY "Public can view cart reservations"
  ON cart_reservations FOR SELECT
  TO public
  USING (true);
