-- Migrate existing users to have initial coins
-- This script adds user_coins records for users who don't have them yet

-- First, let's see how many users don't have user_coins records
SELECT 
  COUNT(*) as users_without_coins
FROM auth.users u
LEFT JOIN user_coins uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL;

-- Insert user_coins records for users who don't have them
-- Set them up with 3 initial coins as free plan users
INSERT INTO user_coins (
  user_id,
  coins,
  subscription_plan,
  last_daily_charge,
  created_at,
  updated_at
)
SELECT 
  u.id,
  3 as coins,
  'free' as subscription_plan,
  CURRENT_DATE as last_daily_charge,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN user_coins uc ON u.id = uc.user_id
WHERE uc.user_id IS NULL;

-- Show the results
SELECT 
  COUNT(*) as total_users_with_coins
FROM user_coins;

-- Show breakdown by subscription plan
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  AVG(coins) as avg_coins
FROM user_coins
GROUP BY subscription_plan
ORDER BY subscription_plan;
