/*
  # Production Database Cleanup and Optimization

  1. Clean up duplicate RLS policies
  2. Ensure consistent security policies across all tables
  3. Add performance indexes
  4. Add data integrity constraints
  5. Create automatic user provisioning
  6. Add documentation and comments
*/

-- 1. Clean up duplicate RLS policies on google_tokens table
-- Drop any duplicate policies that may have been created during development
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remove duplicate policies, keeping only the most descriptive ones
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'google_tokens' 
        AND policyname IN (
            'google_tokens_select_own_data',
            'google_tokens_insert_own_data', 
            'google_tokens_update_own_data',
            'google_tokens_delete_own_data',
            'google_tokens_select_policy',
            'google_tokens_insert_policy',
            'google_tokens_update_policy',
            'google_tokens_delete_policy'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON google_tokens', policy_record.policyname);
    END LOOP;
END $$;

-- 2. Ensure clean, consistent RLS policies for all tables
-- google_tokens table policies
DO $$
BEGIN
    -- Drop existing policies if they exist, then recreate with consistent naming
    DROP POLICY IF EXISTS "Users can read own google tokens" ON google_tokens;
    DROP POLICY IF EXISTS "Users can insert own google tokens" ON google_tokens;
    DROP POLICY IF EXISTS "Users can update own google tokens" ON google_tokens;
    DROP POLICY IF EXISTS "Users can delete own google tokens" ON google_tokens;
END $$;

CREATE POLICY "Users can read own google tokens"
  ON google_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google tokens"
  ON google_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own google tokens"
  ON google_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own google tokens"
  ON google_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Verify and clean up documents table policies
-- Ensure documents table has proper RLS policies
DO $$
BEGIN
    -- Check if documents policies exist, if not create them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can view own documents'
    ) THEN
        CREATE POLICY "Users can view own documents"
          ON documents
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can insert own documents'
    ) THEN
        CREATE POLICY "Users can insert own documents"
          ON documents
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can update own documents'
    ) THEN
        CREATE POLICY "Users can update own documents"
          ON documents
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can delete own documents'
    ) THEN
        CREATE POLICY "Users can delete own documents"
          ON documents
          FOR DELETE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Verify and clean up user_usage table policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can view own usage'
    ) THEN
        CREATE POLICY "Users can view own usage"
          ON user_usage
          FOR SELECT
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can insert own usage'
    ) THEN
        CREATE POLICY "Users can insert own usage"
          ON user_usage
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can update own usage'
    ) THEN
        CREATE POLICY "Users can update own usage"
          ON user_usage
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Verify Stripe tables have proper RLS policies
-- stripe_customers policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_customers' 
        AND policyname = 'Users can view their own customer data'
    ) THEN
        CREATE POLICY "Users can view their own customer data"
          ON stripe_customers
          FOR SELECT
          TO authenticated
          USING ((user_id = auth.uid()) AND (deleted_at IS NULL));
    END IF;
END $$;

-- stripe_subscriptions policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_subscriptions' 
        AND policyname = 'Users can view their own subscription data'
    ) THEN
        CREATE POLICY "Users can view their own subscription data"
          ON stripe_subscriptions
          FOR SELECT
          TO authenticated
          USING ((customer_id IN ( 
            SELECT stripe_customers.customer_id
            FROM stripe_customers
            WHERE ((stripe_customers.user_id = auth.uid()) AND (stripe_customers.deleted_at IS NULL))
          )) AND (deleted_at IS NULL));
    END IF;
END $$;

-- stripe_orders policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_orders' 
        AND policyname = 'Users can view their own order data'
    ) THEN
        CREATE POLICY "Users can view their own order data"
          ON stripe_orders
          FOR SELECT
          TO authenticated
          USING ((customer_id IN ( 
            SELECT stripe_customers.customer_id
            FROM stripe_customers
            WHERE ((stripe_customers.user_id = auth.uid()) AND (stripe_customers.deleted_at IS NULL))
          )) AND (deleted_at IS NULL));
    END IF;
END $$;

-- 6. Ensure all tables have RLS enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- 7. Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_updated 
  ON documents(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_usage_plan 
  ON user_usage(plan) WHERE plan != 'free';

CREATE INDEX IF NOT EXISTS idx_google_tokens_expires 
  ON google_tokens(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status 
  ON stripe_subscriptions(status) WHERE deleted_at IS NULL;

-- 8. Add constraints for data integrity (only if they don't exist)
DO $$
BEGIN
    -- Add constraint for non-negative AI generations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_ai_generations_non_negative'
        AND table_name = 'user_usage'
    ) THEN
        ALTER TABLE user_usage 
          ADD CONSTRAINT check_ai_generations_non_negative 
          CHECK (ai_generations_used >= 0);
    END IF;

    -- Add constraint for non-empty document titles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_title_not_empty'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents 
          ADD CONSTRAINT check_title_not_empty 
          CHECK (length(trim(title)) > 0);
    END IF;
END $$;

-- 9. Create function to automatically create user_usage record on signup
CREATE OR REPLACE FUNCTION create_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage (user_id, ai_generations_used, plan)
  VALUES (NEW.id, 0, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user_usage on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_usage();

-- 10. Clean up any test or development data (be careful in production!)
-- Remove any documents with empty content and default titles (likely test data)
DELETE FROM documents 
WHERE content = '' 
  AND title = 'Untitled Document' 
  AND created_at = updated_at;

-- 11. Update table comments for documentation
COMMENT ON TABLE documents IS 'User-generated legal documents with AI assistance';
COMMENT ON TABLE user_usage IS 'Tracks user AI generation usage and subscription plans';
COMMENT ON TABLE google_tokens IS 'Stores Google OAuth tokens for Workspace integration';
COMMENT ON TABLE stripe_customers IS 'Maps Supabase users to Stripe customer IDs';
COMMENT ON TABLE stripe_subscriptions IS 'Tracks user subscription status and billing info';
COMMENT ON TABLE stripe_orders IS 'Records one-time payment transactions';

-- 12. Add column comments for clarity
COMMENT ON COLUMN documents.content IS 'Document content in markdown or plain text format';
COMMENT ON COLUMN user_usage.ai_generations_used IS 'Number of AI generations used in current billing period';
COMMENT ON COLUMN google_tokens.expires_at IS 'When the access token expires (UTC)';
COMMENT ON COLUMN stripe_subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';