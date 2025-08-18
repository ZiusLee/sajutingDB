-- Update user_coins table to properly track subscription and bonus coins
ALTER TABLE user_coins 
ADD COLUMN IF NOT EXISTS subscription_coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_daily_charge DATE DEFAULT NULL;

-- Migrate existing coins to bonus_coins for backward compatibility
UPDATE user_coins 
SET bonus_coins = coins 
WHERE bonus_coins = 0 AND coins > 0;

-- Add subscription tracking to payment_orders
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS next_billing_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_coins INTEGER DEFAULT 0;

-- Create subscription_charges table to track daily charges
CREATE TABLE IF NOT EXISTS subscription_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_order_id UUID NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  charge_date DATE NOT NULL,
  coins_added INTEGER NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_coins_subscription ON user_coins(user_id, subscription_plan, subscription_start_date);
CREATE INDEX IF NOT EXISTS idx_payment_orders_subscription ON payment_orders(user_id, subscription_status, next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscription_charges_date ON subscription_charges(user_id, charge_date);

-- Create function to calculate total coins (subscription + bonus)
CREATE OR REPLACE FUNCTION get_user_total_coins(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_coins INTEGER;
BEGIN
  SELECT COALESCE(subscription_coins, 0) + COALESCE(bonus_coins, 0)
  INTO total_coins
  FROM user_coins
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(total_coins, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to deduct coins (subscription first, then bonus)
CREATE OR REPLACE FUNCTION deduct_user_coins(user_uuid UUID, amount INTEGER)
RETURNS JSONB AS $$
DECLARE
  current_subscription_coins INTEGER;
  current_bonus_coins INTEGER;
  remaining_amount INTEGER;
  deducted_subscription INTEGER := 0;
  deducted_bonus INTEGER := 0;
BEGIN
  -- Get current coins
  SELECT COALESCE(subscription_coins, 0), COALESCE(bonus_coins, 0)
  INTO current_subscription_coins, current_bonus_coins
  FROM user_coins
  WHERE user_id = user_uuid;
  
  remaining_amount := amount;
  
  -- First deduct from subscription coins
  IF current_subscription_coins > 0 AND remaining_amount > 0 THEN
    deducted_subscription := LEAST(current_subscription_coins, remaining_amount);
    remaining_amount := remaining_amount - deducted_subscription;
  END IF;
  
  -- Then deduct from bonus coins
  IF current_bonus_coins > 0 AND remaining_amount > 0 THEN
    deducted_bonus := LEAST(current_bonus_coins, remaining_amount);
    remaining_amount := remaining_amount - deducted_bonus;
  END IF;
  
  -- Update the coins
  UPDATE user_coins
  SET 
    subscription_coins = current_subscription_coins - deducted_subscription,
    bonus_coins = current_bonus_coins - deducted_bonus,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object(
    'success', remaining_amount = 0,
    'deducted_subscription', deducted_subscription,
    'deducted_bonus', deducted_bonus,
    'remaining_subscription', current_subscription_coins - deducted_subscription,
    'remaining_bonus', current_bonus_coins - deducted_bonus
  );
END;
$$ LANGUAGE plpgsql;
