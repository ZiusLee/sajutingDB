-- Fix user_coins table defaults and update existing users with 0 subscription_coins

BEGIN;

-- Update existing free tier users who have 0 subscription_coins to have 3
UPDATE user_coins 
SET subscription_coins = 3
WHERE (subscription_plan IS NULL OR subscription_plan = 'free') 
  AND subscription_coins = 0;

-- Set all null subscription_plan to 'free'
UPDATE user_coins 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Change the default value for subscription_coins to 3 for free tier
ALTER TABLE user_coins 
ALTER COLUMN subscription_coins SET DEFAULT 3;

-- Ensure subscription_plan defaults to 'free'
ALTER TABLE user_coins 
ALTER COLUMN subscription_plan SET DEFAULT 'free';

COMMIT;
