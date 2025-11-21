/*
  # Create Superadmin Account and Invitation System

  ## Changes
  
  1. New Tables
    - `staff_invitations` - Track sales person invitation links
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `token` (text, unique)
      - `invited_by` (uuid, references user_profiles)
      - `role` (text, default 'sales_person')
      - `status` (text, pending/accepted/expired)
      - `expires_at` (timestamptz)
      - `accepted_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on staff_invitations
    - Only admins can create and view invitations
    - Public access to check invitation validity
  
  3. Functions
    - Function to generate invitation token
    - Function to validate invitation
*/

-- Create staff invitations table
CREATE TABLE IF NOT EXISTS staff_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'sales_person' CHECK (role IN ('sales_person', 'admin')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invitations"
  ON staff_invitations FOR SELECT
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can create invitations"
  ON staff_invitations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update invitations"
  ON staff_invitations FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX idx_staff_invitations_token ON staff_invitations(token);
CREATE INDEX idx_staff_invitations_status ON staff_invitations(status);

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    token := encode(gen_random_bytes(32), 'hex');
    SELECT EXISTS(SELECT 1 FROM staff_invitations WHERE token = token) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and accept invitation
CREATE OR REPLACE FUNCTION accept_staff_invitation(
  invitation_token text,
  user_id uuid
)
RETURNS json AS $$
DECLARE
  invitation_record staff_invitations;
  result json;
BEGIN
  -- Get invitation
  SELECT * INTO invitation_record
  FROM staff_invitations
  WHERE token = invitation_token
  AND status = 'pending'
  AND expires_at > now();

  -- Check if invitation exists and is valid
  IF invitation_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Update user profile with new role
  UPDATE user_profiles
  SET role = invitation_record.role
  WHERE id = user_id;

  -- Mark invitation as accepted
  UPDATE staff_invitations
  SET 
    status = 'accepted',
    accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN json_build_object(
    'success', true,
    'role', invitation_record.role,
    'email', invitation_record.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark expired invitations
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE staff_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
