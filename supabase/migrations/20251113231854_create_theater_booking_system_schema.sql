/*
  # Theater Ticket Booking System - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for a theater ticket booking system
  with support for multiple user roles, venue management, play scheduling, seat booking,
  payments, and comprehensive reporting.

  ## Tables Created

  ### User Management
  - `user_profiles` - Extended user information and role assignments
  - `user_roles` - Role definitions (admin, sales_person, customer)

  ### Venue & Theater Management
  - `venues` - Theater halls/spaces
  - `seats` - Individual seats with layout information
  - `seat_sections` - Seating sections (Orchestra, Balcony, etc.)
  - `pricing_tiers` - Different pricing levels for seat sections

  ### Production Management
  - `plays` - Play information and metadata
  - `actors` - Actor profiles with photos and bios
  - `play_actors` - Many-to-many relationship between plays and actors
  - `performances` - Scheduled showings of plays

  ### Booking & Sales
  - `bookings` - Customer reservations
  - `booking_seats` - Individual seats in a booking
  - `payments` - Payment transactions
  - `tickets` - Generated tickets with barcodes
  - `cart_reservations` - Temporary seat holds during checkout

  ### Discounts & Promotions
  - `discount_codes` - Promotional codes and rules
  - `discount_usage` - Track discount code usage

  ### System Configuration
  - `system_settings` - Global configuration options
  - `cancellation_policies` - Refund rules based on timing

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for each user role with appropriate permissions
  - Admin has full access, sales_person has operational access, customers have limited access

  ## Important Notes
  1. All tables use UUID primary keys
  2. Timestamps track creation and modification
  3. Soft deletes used where appropriate
  4. Indexes on foreign keys and frequently queried columns
  5. Constraints ensure data integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER ROLES & PROFILES
-- =============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'sales_person', 'customer')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- VENUE MANAGEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active venues"
  ON venues FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage venues"
  ON venues FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- SEATING SECTIONS & PRICING
-- =============================================

CREATE TABLE IF NOT EXISTS seat_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seat_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seat sections"
  ON seat_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage seat sections"
  ON seat_sections FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL CHECK (base_price >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing tiers"
  ON pricing_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage pricing tiers"
  ON pricing_tiers FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- SEATS
-- =============================================

CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  section_id uuid REFERENCES seat_sections(id) ON DELETE SET NULL,
  row_label text NOT NULL,
  seat_number text NOT NULL,
  is_wheelchair_accessible boolean DEFAULT false,
  is_companion_seat boolean DEFAULT false,
  is_restricted_view boolean DEFAULT false,
  is_available boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, row_label, seat_number)
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available seats"
  ON seats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage seats"
  ON seats FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_seats_venue ON seats(venue_id);
CREATE INDEX idx_seats_section ON seats(section_id);

-- =============================================
-- ACTORS
-- =============================================

CREATE TABLE IF NOT EXISTS actors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  biography text,
  photo_url text,
  social_media jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view actors"
  ON actors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage actors"
  ON actors FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- PLAYS
-- =============================================

CREATE TABLE IF NOT EXISTS plays (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  description text NOT NULL,
  synopsis text,
  genre text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  age_rating text DEFAULT 'G',
  director_name text,
  language text DEFAULT 'English',
  poster_url text,
  images jsonb DEFAULT '[]'::jsonb,
  trailer_url text,
  special_notes text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plays"
  ON plays FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plays"
  ON plays FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_plays_genre ON plays(genre);
CREATE INDEX idx_plays_featured ON plays(is_featured) WHERE is_featured = true;

-- =============================================
-- PLAY-ACTOR RELATIONSHIPS
-- =============================================

CREATE TABLE IF NOT EXISTS play_actors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  billing_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(play_id, actor_id, role_name)
);

ALTER TABLE play_actors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view play actors"
  ON play_actors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage play actors"
  ON play_actors FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_play_actors_play ON play_actors(play_id);
CREATE INDEX idx_play_actors_actor ON play_actors(actor_id);

-- =============================================
-- PERFORMANCES (SCHEDULED SHOWINGS)
-- =============================================

CREATE TABLE IF NOT EXISTS performances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  performance_date date NOT NULL,
  performance_time time NOT NULL,
  base_price decimal(10,2) NOT NULL CHECK (base_price >= 0),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sold_out', 'cancelled', 'postponed', 'completed')),
  available_seats integer,
  total_seats integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view performances"
  ON performances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage performances"
  ON performances FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_performances_play ON performances(play_id);
CREATE INDEX idx_performances_venue ON performances(venue_id);
CREATE INDEX idx_performances_date ON performances(performance_date);
CREATE INDEX idx_performances_status ON performances(status);

-- =============================================
-- DISCOUNT CODES
-- =============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value decimal(10,2) NOT NULL CHECK (discount_value >= 0),
  min_tickets integer DEFAULT 1,
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discount codes"
  ON discount_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage discount codes"
  ON discount_codes FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- =============================================
-- BOOKINGS
-- =============================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_reference text UNIQUE NOT NULL,
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  total_seats integer NOT NULL CHECK (total_seats > 0 AND total_seats <= 10),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount decimal(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  booking_fee decimal(10,2) DEFAULT 0 CHECK (booking_fee >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded', 'checked_in')),
  booked_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_method text DEFAULT 'online' CHECK (booking_method IN ('online', 'box_office')),
  discount_code_id uuid REFERENCES discount_codes(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR booked_by_user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR booked_by_user_id = auth.uid());

CREATE POLICY "Sales persons and admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person'));

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_bookings_performance ON bookings(performance_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);

-- =============================================
-- BOOKING SEATS (INDIVIDUAL SEATS IN A BOOKING)
-- =============================================

CREATE TABLE IF NOT EXISTS booking_seats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, seat_id)
);

ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking seats"
  ON booking_seats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_seats.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can view all booking seats"
  ON booking_seats FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person'));

CREATE POLICY "Admins can manage booking seats"
  ON booking_seats FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_booking_seats_booking ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat ON booking_seats(seat_id);

-- =============================================
-- CART RESERVATIONS (TEMPORARY SEAT HOLDS)
-- =============================================

CREATE TABLE IF NOT EXISTS cart_reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text NOT NULL,
  performance_id uuid NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reserved_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(performance_id, seat_id)
);

ALTER TABLE cart_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart reservations"
  ON cart_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cart reservations"
  ON cart_reservations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_cart_reservations_session ON cart_reservations(session_id);
CREATE INDEX idx_cart_reservations_expires ON cart_reservations(reserved_until);
CREATE INDEX idx_cart_reservations_performance ON cart_reservations(performance_id);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'cash', 'digital_wallet', 'other')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  transaction_id text,
  payment_gateway text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  refunded_amount decimal(10,2) DEFAULT 0 CHECK (refunded_amount >= 0),
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person'));

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- =============================================
-- TICKETS
-- =============================================

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  ticket_code text UNIQUE NOT NULL,
  barcode_data text UNIQUE NOT NULL,
  is_checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, seat_id)
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = tickets.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can view and update tickets"
  ON tickets FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person'))
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person'));

CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_barcode ON tickets(barcode_data);
CREATE INDEX idx_tickets_checked_in ON tickets(is_checked_in);

-- =============================================
-- DISCOUNT USAGE TRACKING
-- =============================================

CREATE TABLE IF NOT EXISTS discount_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id uuid NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_amount decimal(10,2) NOT NULL CHECK (discount_amount >= 0),
  used_at timestamptz DEFAULT now()
);

ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discount usage"
  ON discount_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = discount_usage.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all discount usage"
  ON discount_usage FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_discount_usage_code ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_booking ON discount_usage(booking_id);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('cart_reservation_minutes', '10', 'Minutes to hold seats in cart before release'),
  ('booking_cutoff_hours', '1', 'Hours before performance when booking closes'),
  ('enable_guest_checkout', 'true', 'Allow guest checkout without account'),
  ('max_seats_per_booking', '10', 'Maximum seats per single booking'),
  ('booking_fee_percentage', '2.5', 'Booking fee as percentage of subtotal'),
  ('theater_name', '"Local Theater"', 'Name of the theater'),
  ('theater_email', '"info@theater.com"', 'Contact email address'),
  ('theater_phone', '"+1-555-0100"', 'Contact phone number')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- CANCELLATION POLICIES
-- =============================================

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  days_before_performance integer NOT NULL CHECK (days_before_performance >= 0),
  refund_percentage decimal(5,2) NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(days_before_performance)
);

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cancellation policies"
  ON cancellation_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cancellation policies"
  ON cancellation_policies FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

-- Insert default cancellation policies
INSERT INTO cancellation_policies (days_before_performance, refund_percentage, description) VALUES
  (7, 100.00, 'Full refund for cancellations 7+ days before performance'),
  (3, 50.00, 'Partial refund (50%) for cancellations 3-7 days before performance'),
  (0, 0.00, 'No refund for cancellations less than 3 days before performance')
ON CONFLICT (days_before_performance) DO NOTHING;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text AS $$
DECLARE
  ref text;
  exists boolean;
BEGIN
  LOOP
    ref := 'BK' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_reference = ref) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'TK' || LPAD(FLOOR(RANDOM() * 10000000)::text, 8, '0');
    SELECT EXISTS(SELECT 1 FROM tickets WHERE ticket_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cart reservations
CREATE OR REPLACE FUNCTION clean_expired_cart_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM cart_reservations WHERE reserved_until < now();
END;
$$ LANGUAGE plpgsql;

-- Function to update performance available seats count
CREATE OR REPLACE FUNCTION update_performance_seat_count()
RETURNS trigger AS $$
BEGIN
  UPDATE performances
  SET available_seats = (
    SELECT COUNT(DISTINCT s.id)
    FROM seats s
    WHERE s.venue_id = performances.venue_id
    AND s.is_available = true
    AND NOT EXISTS (
      SELECT 1 FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE bs.seat_id = s.id
      AND b.performance_id = performances.id
      AND b.status IN ('confirmed', 'checked_in')
    )
  ),
  total_seats = (
    SELECT COUNT(*) FROM seats WHERE venue_id = performances.venue_id AND is_available = true
  )
  WHERE id = NEW.performance_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update performance seat counts after booking
CREATE TRIGGER update_performance_seats_after_booking
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status IN ('confirmed', 'checked_in'))
EXECUTE FUNCTION update_performance_seat_count();
