-- Restructure user_coins table to use subscription_coins and bonus_coins only
-- Remove coins column and set all null subscription_plan to 'free'

BEGIN;

-- Update all null subscription_plan values to 'free'
UPDATE user_coins 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Migrate existing coins to subscription_coins for users who don't have subscription_coins set
UPDATE user_coins 
SET subscription_coins = COALESCE(coins, 0)
WHERE subscription_coins IS NULL OR subscription_coins = 0;

-- Set default bonus_coins to 0 for users who don't have it set
UPDATE user_coins 
SET bonus_coins = COALESCE(bonus_coins, 0)
WHERE bonus_coins IS NULL;

-- Set subscription_plan default constraint
ALTER TABLE user_coins 
ALTER COLUMN subscription_plan SET DEFAULT 'free';

-- Set subscription_coins default constraint
ALTER TABLE user_coins 
ALTER COLUMN subscription_coins SET DEFAULT 0;

-- Set bonus_coins default constraint
ALTER TABLE user_coins 
ALTER COLUMN bonus_coins SET DEFAULT 0;

-- Add NOT NULL constraints
ALTER TABLE user_coins 
ALTER COLUMN subscription_plan SET NOT NULL;

ALTER TABLE user_coins 
ALTER COLUMN subscription_coins SET NOT NULL;

ALTER TABLE user_coins 
ALTER COLUMN bonus_coins SET NOT NULL;

-- Drop the coins column as we're now using subscription_coins and bonus_coins only
ALTER TABLE user_coins DROP COLUMN IF EXISTS coins;

-- Create index for better performance on subscription_plan queries
CREATE INDEX IF NOT EXISTS idx_user_coins_subscription_plan ON user_coins(subscription_plan);

-- Create a view to easily see total available coins per user
CREATE OR REPLACE VIEW user_total_coins AS
SELECT 
    user_id,
    subscription_coins,
    bonus_coins,
    (subscription_coins + bonus_coins) as total_coins,
    subscription_plan,
    last_daily_charge,
    created_at,
    updated_at
FROM user_coins;

COMMIT;
