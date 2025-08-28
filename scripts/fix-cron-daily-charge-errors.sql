-- Fix cron daily charge errors
-- 1. Fix function return type issues
-- 2. Ensure all required columns exist

-- Drop and recreate execute_scheduled_plan_changes function with correct return type
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
      COALESCE(subscription_plan, 'free')::text as old_plan,
      COALESCE(scheduled_plan_change, 'free')::text as new_plan
  )
  SELECT 
    pc.user_id,
    pc.old_plan,
    pc.new_plan,
    'scheduled_change_executed'::text as action_taken
  FROM plan_changes pc;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate handle_expired_subscriptions function with correct return type
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
      COALESCE(subscription_plan, 'free')::text as expired_plan
  )
  SELECT 
    es.user_id,
    es.expired_plan,
    'downgraded_to_free'::text as action_taken
  FROM expired_subs es;
END;
$$ LANGUAGE plpgsql;

-- Ensure payment_failure_count column exists and has default value
ALTER TABLE user_coins 
ALTER COLUMN payment_failure_count SET DEFAULT 0;

-- Update any NULL values to 0
UPDATE user_coins 
SET payment_failure_count = 0 
WHERE payment_failure_count IS NULL;

-- Add constraint to ensure payment_failure_count is never NULL
ALTER TABLE user_coins 
ALTER COLUMN payment_failure_count SET NOT NULL;

-- Create index for better performance on daily charge queries
CREATE INDEX IF NOT EXISTS idx_user_coins_daily_charge 
ON user_coins(last_daily_charge, subscription_plan);

-- Create index for subscription end date queries
CREATE INDEX IF NOT EXISTS idx_user_coins_subscription_end 
ON user_coins(subscription_end_date) 
WHERE subscription_end_date IS NOT NULL;

-- Create index for scheduled plan changes
CREATE INDEX IF NOT EXISTS idx_user_coins_scheduled_changes 
ON user_coins(scheduled_date, scheduled_plan_change) 
WHERE scheduled_plan_change IS NOT NULL;

-- Verify the functions work correctly
SELECT 'Testing execute_scheduled_plan_changes function' as test;
SELECT * FROM execute_scheduled_plan_changes() LIMIT 1;

SELECT 'Testing handle_expired_subscriptions function' as test;
SELECT * FROM handle_expired_subscriptions() LIMIT 1;

-- Show current user_coins table structure
SELECT 'Current user_coins table columns' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_coins' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
