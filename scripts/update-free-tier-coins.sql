-- Update all free tier users to have 3 subscription_coins
-- This ensures consistency across all existing free plan users

-- First, set subscription_plan to 'free' for all null values
UPDATE user_coins 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Update all free tier users to have exactly 3 subscription_coins
UPDATE user_coins 
SET 
  subscription_coins = 3,
  updated_at = NOW()
WHERE subscription_plan = 'free';

-- Verify the update
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  AVG(subscription_coins) as avg_subscription_coins,
  MIN(subscription_coins) as min_subscription_coins,
  MAX(subscription_coins) as max_subscription_coins
FROM user_coins 
GROUP BY subscription_plan
ORDER BY subscription_plan;

-- Show users who were updated
SELECT 
  user_id,
  subscription_plan,
  subscription_coins,
  bonus_coins,
  last_daily_charge,
  updated_at
FROM user_coins 
WHERE subscription_plan = 'free'
ORDER BY updated_at DESC
LIMIT 20;
