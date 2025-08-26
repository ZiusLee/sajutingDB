-- Debug script to check cron system status and fix issues

-- 1. Check if cron_executions table exists and has data
SELECT 
  'Cron Executions Table Status' as check_type,
  COUNT(*) as total_executions,
  MAX(execution_time) as last_execution,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs
FROM cron_executions 
WHERE job_name = 'daily-subscription';

-- 2. Check recent cron execution details
SELECT 
  execution_date,
  execution_time,
  status,
  success_count,
  error_count,
  total_users,
  free_users,
  subscription_users,
  error_message,
  details->>'isVercelCron' as is_vercel_cron,
  details->>'isManualTest' as is_manual_test
FROM cron_executions 
WHERE job_name = 'daily-subscription'
ORDER BY execution_time DESC 
LIMIT 10;

-- 3. Check user_coins table for users who should have been charged today
SELECT 
  'Users Needing Daily Charge' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_plan IS NULL OR subscription_plan = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN subscription_plan IS NOT NULL AND subscription_plan != 'free' THEN 1 END) as subscription_users,
  COUNT(CASE WHEN last_daily_charge = CURRENT_DATE THEN 1 END) as charged_today,
  COUNT(CASE WHEN last_daily_charge != CURRENT_DATE OR last_daily_charge IS NULL THEN 1 END) as needs_charge
FROM user_coins;

-- 4. Check subscription status and expiration
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  COUNT(CASE WHEN subscription_end_date IS NOT NULL AND subscription_end_date >= CURRENT_DATE THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN subscription_end_date IS NOT NULL AND subscription_end_date < CURRENT_DATE THEN 1 END) as expired_subscriptions,
  COUNT(CASE WHEN scheduled_plan_change IS NOT NULL THEN 1 END) as pending_changes
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

-- 5. Check for users with expired subscriptions that need to be downgraded
SELECT 
  'Expired Subscriptions Needing Downgrade' as issue_type,
  user_id,
  subscription_plan,
  subscription_end_date,
  subscription_coins,
  last_daily_charge
FROM user_coins 
WHERE subscription_plan IS NOT NULL 
  AND subscription_plan != 'free'
  AND subscription_end_date IS NOT NULL 
  AND subscription_end_date < CURRENT_DATE
LIMIT 10;

-- 6. Check for users with scheduled plan changes that are overdue
SELECT 
  'Overdue Scheduled Plan Changes' as issue_type,
  user_id,
  subscription_plan,
  scheduled_plan_change,
  scheduled_date,
  subscription_end_date
FROM user_coins 
WHERE scheduled_plan_change IS NOT NULL 
  AND scheduled_date IS NOT NULL 
  AND scheduled_date::date <= CURRENT_DATE
LIMIT 10;

-- 7. Verify database functions exist
SELECT 
  'Database Functions Status' as check_type,
  proname as function_name,
  prosrc IS NOT NULL as function_exists
FROM pg_proc 
WHERE proname IN ('execute_scheduled_plan_changes', 'handle_expired_subscriptions');

-- 8. Check payment_orders for active subscriptions
SELECT 
  'Active Payment Orders' as check_type,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN subscription_status = 'expired' THEN 1 END) as expired_subscriptions,
  COUNT(CASE WHEN next_billing_date IS NOT NULL AND next_billing_date < CURRENT_DATE THEN 1 END) as overdue_billing
FROM payment_orders 
WHERE subscription_type IS NOT NULL;
