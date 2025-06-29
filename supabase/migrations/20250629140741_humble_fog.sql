/*
  # Fix Google Tokens RLS Policies

  This migration safely handles existing RLS policies on the google_tokens table.
  It checks for existing policies and only creates missing ones with unique names.

  1. Security
    - Ensures all CRUD operations have proper RLS policies
    - Uses unique policy names to avoid conflicts
    - Maintains user isolation (auth.uid() = user_id)

  2. Policy Coverage
    - SELECT: Users can view their own tokens
    - INSERT: Users can insert their own tokens  
    - UPDATE: Users can update their own tokens
    - DELETE: Users can delete their own tokens
*/

-- Ensure RLS is enabled
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Function to safely create policies
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Check and create SELECT policy with alternative name if needed
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_tokens' 
        AND cmd = 'SELECT'
        AND roles = '{authenticated}'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        CREATE POLICY "google_tokens_select_policy"
          ON google_tokens
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    -- Check and create INSERT policy with alternative name if needed
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_tokens' 
        AND cmd = 'INSERT'
        AND roles = '{authenticated}'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        CREATE POLICY "google_tokens_insert_policy"
          ON google_tokens
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Check and create UPDATE policy with alternative name if needed
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_tokens' 
        AND cmd = 'UPDATE'
        AND roles = '{authenticated}'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        CREATE POLICY "google_tokens_update_policy"
          ON google_tokens
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    -- Check and create DELETE policy with alternative name if needed
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_tokens' 
        AND cmd = 'DELETE'
        AND roles = '{authenticated}'
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
        CREATE POLICY "google_tokens_delete_policy"
          ON google_tokens
          FOR DELETE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;
END $$;