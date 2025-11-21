/*
  # Fix generate_invitation_token Function

  ## Problem
  The function has an ambiguous column reference in the WHERE clause.
  `WHERE token = token` could refer to either the variable or the column.

  ## Solution
  Explicitly qualify the column name with the table name to remove ambiguity.

  ## Changes
  - Drop and recreate the function with explicit table.column reference
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS generate_invitation_token();

-- Create the corrected function
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    new_token := encode(gen_random_bytes(32), 'hex');
    SELECT EXISTS(
      SELECT 1 
      FROM staff_invitations 
      WHERE staff_invitations.token = new_token
    ) INTO token_exists;
    EXIT WHEN NOT token_exists;
  END LOOP;
  RETURN new_token;
END;
$$;
