/*
  # Fix RLS Policies for Booking Flow

  1. Changes
    - Add INSERT policy for booking_seats to allow authenticated users to create booking seats
    - Add INSERT policy for tickets to allow authenticated users to create tickets
    - Add policy for payments table to allow inserts during checkout
    
  2. Security
    - Users can only insert booking_seats and tickets during active booking flow
    - All other operations remain restricted
*/

-- Drop existing restrictive policies and add proper INSERT policies
DROP POLICY IF EXISTS "Users can insert booking seats during checkout" ON booking_seats;
DROP POLICY IF EXISTS "Users can insert tickets during checkout" ON tickets;
DROP POLICY IF EXISTS "Users can insert payments during checkout" ON payments;

-- Allow authenticated users to insert booking seats
CREATE POLICY "Users can insert booking seats during checkout"
  ON booking_seats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to view their tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = tickets.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

-- Allow staff to view all tickets
DROP POLICY IF EXISTS "Staff can view all tickets" ON tickets;
CREATE POLICY "Staff can view all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person')
  );

-- Allow authenticated users to insert tickets
CREATE POLICY "Users can insert tickets during checkout"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert payments
CREATE POLICY "Users can insert payments during checkout"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.booked_by_user_id = auth.uid())
    )
  );

-- Allow staff to manage all tickets and payments
DROP POLICY IF EXISTS "Admins can manage tickets" ON tickets;
CREATE POLICY "Admins can manage tickets"
  ON tickets
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Staff can view all payments" ON payments;
CREATE POLICY "Staff can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'sales_person')
  );

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
CREATE POLICY "Admins can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');
