/*
  # Google OAuth Tokens Table

  1. New Tables
    - `google_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `access_token` (text, encrypted storage recommended)
      - `refresh_token` (text, encrypted storage recommended)
      - `token_type` (text, default 'Bearer')
      - `expires_at` (timestamp)
      - `scope` (text, granted permissions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `google_tokens` table
    - Add policies for users to manage their own tokens
    - Foreign key constraint to users table
    - Indexes for performance

  3. Notes
    - Tokens should be encrypted in production
    - Automatic cleanup of expired tokens recommended
    - Scope tracking for permission management
*/

-- Create google_tokens table
CREATE TABLE IF NOT EXISTS google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id (one Google account per user)
CREATE UNIQUE INDEX IF NOT EXISTS google_tokens_user_id_key ON google_tokens(user_id);

-- Create index for token expiration queries
CREATE INDEX IF NOT EXISTS google_tokens_expires_at_idx ON google_tokens(expires_at);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS google_tokens_user_id_idx ON google_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view own tokens"
  ON google_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON google_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON google_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
  ON google_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);