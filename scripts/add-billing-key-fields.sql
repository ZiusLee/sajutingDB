-- Add billing key related fields to user_coins table
ALTER TABLE user_coins 
ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add payment tracking to subscription_charges table
ALTER TABLE subscription_charges
ADD COLUMN IF NOT EXISTS payment_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT NULL;

-- Add index for billing key lookups
CREATE INDEX IF NOT EXISTS idx_payment_orders_billing_key ON payment_orders(user_id, billing_key, subscription_status);

-- Add index for payment failure tracking
CREATE INDEX IF NOT EXISTS idx_user_coins_failures ON user_coins(user_id, payment_failure_count, subscription_status);
