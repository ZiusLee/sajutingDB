-- Fix cron database errors by adding missing columns and fixing function return types

-- 1. Add missing columns to user_coins table
ALTER TABLE user_coins 
ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_coins_failures ON user_coins(user_id, payment_failure_count, subscription_status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_billing_key ON payment_orders(user_id, billing_key, subscription_status);

-- 3. Fix the execute_scheduled_plan_changes function return type
DROP FUNCTION IF EXISTS execute_scheduled_plan_changes();

CREATE OR REPLACE FUNCTION execute_scheduled_plan_changes()
RETURNS TABLE(
  user_id uuid,
  old_plan text,
  new_plan text,
  action_taken text
) AS $$
BEGIN
  RETURN QUERY
  WITH plan_changes AS (
    UPDATE user_coins 
    SET 
      subscription_plan = scheduled_plan_change,
      subscription_coins = CASE 
        WHEN scheduled_plan_change = 'free' THEN 3
        ELSE subscription_coins
      END,
      subscription_start_date = CURRENT_DATE,
      subscription_end_date = CASE 
        WHEN scheduled_plan_change = 'free' THEN NULL
        ELSE CURRENT_DATE + INTERVAL '7 days'
      END,
      scheduled_plan_change = NULL,
      scheduled_date = NULL,
      updated_at = NOW()
    WHERE scheduled_plan_change IS NOT NULL 
      AND scheduled_date IS NOT NULL 
      AND scheduled_date::date <= CURRENT_DATE
    RETURNING 
      user_coins.user_id,
      COALESCE(subscription_plan, 'unknown')::text as old_plan,
      COALESCE(scheduled_plan_change, 'unknown')::text as new_plan
  )
  SELECT 
    pc.user_id,
    pc.old_plan,
    pc.new_plan,
    'scheduled_change_executed'::text as action_taken
  FROM plan_changes pc;
END;
$$ LANGUAGE plpgsql;

-- 4. Also fix the handle_expired_subscriptions function for consistency
DROP FUNCTION IF EXISTS handle_expired_subscriptions();

CREATE OR REPLACE FUNCTION handle_expired_subscriptions()
RETURNS TABLE(
  user_id uuid,
  expired_plan text,
  action_taken text
) AS $$
BEGIN
  RETURN QUERY
  WITH expired_subs AS (
    UPDATE user_coins 
    SET 
      subscription_plan = 'free',
      subscription_coins = 3,
      subscription_end_date = NULL,
      updated_at = NOW()
    WHERE subscription_plan IS NOT NULL 
      AND subscription_plan != 'free'
      AND subscription_end_date IS NOT NULL 
      AND subscription_end_date < CURRENT_DATE
    RETURNING 
      user_coins.user_id,
      COALESCE(subscription_plan, 'unknown')::text as expired_plan
  )
  SELECT 
    es.user_id,
    es.expired_plan,
    'downgraded_to_free'::text as action_taken
  FROM expired_subs es;
END;
$$ LANGUAGE plpgsql;

-- 5. Verify the fixes
SELECT 'Database schema fixes applied successfully' as status;

-- Check if columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_coins' 
  AND column_name IN ('payment_failure_count', 'subscription_status')
ORDER BY column_name;
