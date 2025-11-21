/*
  # Fix User Profile Creation on Signup

  1. Changes
    - Add INSERT policy to allow users to create their own profile during signup
    - This fixes the issue where new signups couldn't create their user_profiles entry

  2. Security
    - Users can only insert their own profile (auth.uid() = id)
    - Users can only set role to 'customer' on self-insert
    - Admin/sales_person roles can only be created by service role or invitations
*/

-- Allow users to create their own profile during signup
CREATE POLICY "Users can create own profile on signup"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND role = 'customer'
  );
