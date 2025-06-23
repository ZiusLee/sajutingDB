-- 현재 payment_orders 테이블 구조 확인 및 수정
-- package_name, customer_name, customer_email 컬럼이 없다면 제거하고 간단하게 만들기

-- 기존 테이블이 있다면 삭제하고 새로 생성
DROP TABLE IF EXISTS payment_orders CASCADE;

-- 간단한 결제 주문 테이블 생성
CREATE TABLE payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  coins INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_key VARCHAR(255),
  payment_data JSONB,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 complete_payment 함수 수정
CREATE OR REPLACE FUNCTION complete_payment(
  p_order_id VARCHAR(255),
  p_user_id UUID,
  p_coins INTEGER,
  p_payment_key VARCHAR(255),
  p_payment_data JSONB
) RETURNS VOID AS $$
BEGIN
  -- 결제 주문 상태 업데이트
  UPDATE payment_orders 
  SET 
    status = 'completed',
    payment_key = p_payment_key,
    payment_data = p_payment_data,
    updated_at = NOW()
  WHERE order_id = p_order_id;

  -- 사용자 코인 추가 (user_coins 테이블이 없다면 생성)
  INSERT INTO user_coins (user_id, coins, created_at, updated_at)
  VALUES (p_user_id, p_coins, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    coins = user_coins.coins + p_coins,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- user_coins 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS user_coins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON user_coins(user_id);
