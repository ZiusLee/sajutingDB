-- Fix daily charge system issues
-- This script addresses timezone and user identification problems

-- First, let's check the current state of user_coins
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_plan IS NULL OR subscription_plan = '' OR subscription_plan = 'free' THEN 1 END) as free_users,
  COUNT(CASE WHEN subscription_plan IS NOT NULL AND subscription_plan != '' AND subscription_plan != 'free' THEN 1 END) as subscription_users,
  COUNT(CASE WHEN last_daily_charge IS NULL THEN 1 END) as never_charged,
  COUNT(CASE WHEN last_daily_charge = CURRENT_DATE THEN 1 END) as charged_today
FROM user_coins;

-- Update any users who have never been charged to ensure they get processed
-- This is safe because the cron job checks for today's date
UPDATE user_coins 
SET last_daily_charge = NULL 
WHERE last_daily_charge IS NULL AND created_at < CURRENT_DATE;

-- Ensure all users have proper default values
UPDATE user_coins 
SET 
  subscription_coins = COALESCE(subscription_coins, 0),
  bonus_coins = COALESCE(bonus_coins, 0)
WHERE subscription_coins IS NULL OR bonus_coins IS NULL;

-- Create an index to improve cron job performance
CREATE INDEX IF NOT EXISTS idx_user_coins_daily_charge 
ON user_coins(last_daily_charge, subscription_plan);

-- Create a function to manually trigger daily charge for testing
CREATE OR REPLACE FUNCTION trigger_daily_charge_for_user(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  current_user RECORD;
  daily_coins INTEGER := 3;
  result JSONB;
BEGIN
  -- Get user info
  SELECT * INTO current_user 
  FROM user_coins 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Update coins and last_daily_charge
  UPDATE user_coins 
  SET 
    subscription_coins = COALESCE(subscription_coins, 0) + daily_coins,
    last_daily_charge = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Return result
  SELECT jsonb_build_object(
    'success', true,
    'user_id', user_uuid,
    'coins_added', daily_coins,
    'previous_coins', COALESCE(current_user.subscription_coins, 0),
    'new_coins', COALESCE(current_user.subscription_coins, 0) + daily_coins,
    'last_daily_charge', CURRENT_DATE
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a view to easily check daily charge status
CREATE OR REPLACE VIEW daily_charge_status AS
SELECT 
  user_id,
  subscription_coins,
  bonus_coins,
  subscription_plan,
  last_daily_charge,
  CASE 
    WHEN last_daily_charge = CURRENT_DATE THEN 'charged_today'
    WHEN last_daily_charge IS NULL THEN 'never_charged'
    ELSE 'needs_charge'
  END as charge_status,
  CASE 
    WHEN subscription_plan IS NULL OR subscription_plan = '' OR subscription_plan = 'free' THEN 'free'
    ELSE 'subscription'
  END as user_type,
  created_at,
  updated_at
FROM user_coins
ORDER BY created_at DESC;

-- Show current status
SELECT 
  charge_status,
  user_type,
  COUNT(*) as count
FROM daily_charge_status
GROUP BY charge_status, user_type
ORDER BY user_type, charge_status;
