-- Fix subscription plan change integration and scheduled downgrades
-- This script ensures proper integration between user_coins table and subscription management

-- 1. Execute scheduled plan changes that are due
UPDATE user_coins 
SET 
  subscription_plan = scheduled_plan_change,
  subscription_coins = CASE 
    WHEN scheduled_plan_change = 'free' THEN 3
    WHEN scheduled_plan_change = 'starter' THEN subscription_coins
    WHEN scheduled_plan_change = 'plus' THEN subscription_coins  
    WHEN scheduled_plan_change = 'pro' THEN subscription_coins
    ELSE 3
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
  AND scheduled_date::date <= CURRENT_DATE;

-- 2. Handle expired subscriptions - downgrade to free
UPDATE user_coins 
SET 
  subscription_plan = 'free',
  subscription_coins = 3,
  subscription_end_date = NULL,
  updated_at = NOW()
WHERE subscription_plan IS NOT NULL 
  AND subscription_plan != 'free'
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date < CURRENT_DATE;

-- 3. Deactivate expired payment orders
UPDATE payment_orders 
SET 
  subscription_status = 'expired',
  updated_at = NOW()
WHERE subscription_status = 'active'
  AND next_billing_date IS NOT NULL 
  AND next_billing_date < CURRENT_DATE;

-- 4. Create function to handle scheduled plan changes
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
      subscription_plan as old_plan,
      scheduled_plan_change as new_plan
  )
  SELECT 
    pc.user_id,
    pc.old_plan,
    pc.new_plan,
    'scheduled_change_executed' as action_taken
  FROM plan_changes pc;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to handle subscription expiration
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
      subscription_plan as expired_plan
  )
  SELECT 
    es.user_id,
    es.expired_plan,
    'downgraded_to_free' as action_taken
  FROM expired_subs es;
END;
$$ LANGUAGE plpgsql;

-- 6. Create view for subscription status monitoring
CREATE OR REPLACE VIEW subscription_status_overview AS
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  COUNT(CASE WHEN scheduled_plan_change IS NOT NULL THEN 1 END) as pending_changes,
  COUNT(CASE WHEN subscription_end_date IS NOT NULL AND subscription_end_date < CURRENT_DATE THEN 1 END) as expired_subscriptions,
  AVG(subscription_coins) as avg_subscription_coins,
  AVG(bonus_coins) as avg_bonus_coins
FROM user_coins 
GROUP BY subscription_plan
ORDER BY 
  CASE subscription_plan 
    WHEN 'pro' THEN 1
    WHEN 'plus' THEN 2  
    WHEN 'starter' THEN 3
    WHEN 'free' THEN 4
    ELSE 5
  END;

-- 7. Verify the fixes
SELECT 'Subscription Integration Status' as status;
SELECT * FROM subscription_status_overview;

-- Show any remaining issues
SELECT 
  'Users with scheduled changes due today or overdue' as issue_type,
  COUNT(*) as count
FROM user_coins 
WHERE scheduled_plan_change IS NOT NULL 
  AND scheduled_date IS NOT NULL 
  AND scheduled_date::date <= CURRENT_DATE;

SELECT 
  'Users with expired subscriptions' as issue_type,
  COUNT(*) as count  
FROM user_coins 
WHERE subscription_plan IS NOT NULL 
  AND subscription_plan != 'free'
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date < CURRENT_DATE;
