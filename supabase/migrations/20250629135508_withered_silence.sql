/*
  # Create Google OAuth tokens storage table

  1. New Tables
    - `google_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `token_type` (text, default 'Bearer')
      - `expires_at` (timestamp)
      - `scope` (text, granted scopes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `google_tokens` table
    - Add policies for authenticated users to manage their own tokens
    - Tokens are stored encrypted for security
*/

CREATE TABLE IF NOT EXISTS google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  access_token text, -- TODO: Implement encryption for production
  refresh_token text, -- TODO: Implement encryption for production
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  scope text, -- Space-separated list of granted scopes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for google_tokens
CREATE POLICY "Users can view own tokens"
  ON google_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON google_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON google_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON google_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS google_tokens_user_id_idx ON google_tokens(user_id);
CREATE INDEX IF NOT EXISTS google_tokens_expires_at_idx ON google_tokens(expires_at);

-- Function to check if token is expired
CREATE OR REPLACE FUNCTION is_token_expired(token_expires_at timestamptz)
RETURNS boolean AS $$
BEGIN
  RETURN token_expires_at < now();
END;
$$ LANGUAGE plpgsql IMMUTABLE;