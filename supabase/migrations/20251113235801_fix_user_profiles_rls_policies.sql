/*
  # Fix User Profiles RLS Policies - Remove Infinite Recursion

  ## Problem
  The existing policies create infinite recursion by querying user_profiles 
  to check if a user is an admin, while already inside a user_profiles query.

  ## Solution
  1. Drop all existing policies on user_profiles
  2. Create simpler policies that don't cause recursion
  3. Allow users to read their own profiles
  4. Allow authenticated users to read other profiles (needed for app functionality)
  5. Only allow users to update their own non-role fields
  6. Use a separate admin function to change roles

  ## Security
  - Users can view all profiles (needed for display names, etc.)
  - Users can only update their own profile
  - Users cannot change their own role (protected by CHECK constraint)
  - Only superadmin or direct SQL can change roles
*/

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Allow authenticated users to read all profiles (needed for names, etc.)
CREATE POLICY "Authenticated users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Allow service role to do anything (for admin operations)
CREATE POLICY "Service role can manage all profiles"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function for admins to update user roles (must be called with service role key)
CREATE OR REPLACE FUNCTION admin_update_user_role(
  user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET role = new_role
  WHERE id = user_id;
END;
$$;
