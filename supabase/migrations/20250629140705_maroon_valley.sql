/*
  # Update Google Tokens RLS Policies

  1. Security Updates
    - Check for existing policies and create only missing ones
    - Ensure all CRUD operations have proper RLS coverage
    - Use unique policy names to avoid conflicts

  2. RLS Policies
    - SELECT: Users can view their own tokens
    - INSERT: Users can insert their own tokens  
    - UPDATE: Users can update their own tokens
    - DELETE: Users can delete their own tokens
*/

-- Enable Row Level Security if not already enabled
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND policyname = 'Users can view own tokens'
  ) THEN
    CREATE POLICY "Users can view own tokens"
      ON google_tokens
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create INSERT policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND policyname = 'Users can insert own tokens'
  ) THEN
    CREATE POLICY "Users can insert own tokens"
      ON google_tokens
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create UPDATE policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND policyname = 'Users can update own tokens'
  ) THEN
    CREATE POLICY "Users can update own tokens"
      ON google_tokens
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create DELETE policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND policyname = 'Users can delete own tokens'
  ) THEN
    CREATE POLICY "Users can delete own tokens"
      ON google_tokens
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create additional policies with unique names if the standard ones exist
DO $$
BEGIN
  -- Alternative SELECT policy with unique name
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND cmd = 'SELECT'
    AND roles = '{authenticated}'
  ) THEN
    CREATE POLICY "google_tokens_select_own_data"
      ON google_tokens
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Alternative INSERT policy with unique name
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND cmd = 'INSERT'
    AND roles = '{authenticated}'
  ) THEN
    CREATE POLICY "google_tokens_insert_own_data"
      ON google_tokens
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Alternative UPDATE policy with unique name
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND cmd = 'UPDATE'
    AND roles = '{authenticated}'
  ) THEN
    CREATE POLICY "google_tokens_update_own_data"
      ON google_tokens
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Alternative DELETE policy with unique name
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'google_tokens' 
    AND cmd = 'DELETE'
    AND roles = '{authenticated}'
  ) THEN
    CREATE POLICY "google_tokens_delete_own_data"
      ON google_tokens
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;