-- 결제 주문 테이블
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id VARCHAR(50) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  coins INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_key VARCHAR(255),
  toss_payment_data JSONB,
  failure_reason TEXT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 처리 성공 함수
CREATE OR REPLACE FUNCTION process_payment_success(
  p_order_id VARCHAR(255),
  p_user_id UUID,
  p_coins INTEGER,
  p_payment_key VARCHAR(255),
  p_toss_payment_data JSONB
)
RETURNS VOID AS $$
BEGIN
  -- 주문 상태 업데이트
  UPDATE payment_orders 
  SET 
    status = 'completed',
    payment_key = p_payment_key,
    toss_payment_data = p_toss_payment_data,
    updated_at = NOW()
  WHERE order_id = p_order_id;

  -- 사용자 코인 충전
  INSERT INTO user_coins (user_id, coins, created_at, updated_at)
  VALUES (p_user_id, p_coins, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_coins.coins + p_coins,
    updated_at = NOW();

  -- 코인 거래 내역 추가
  INSERT INTO coin_transactions (user_id, type, amount, description, created_at)
  VALUES (p_user_id, 'purchase', p_coins, '코인 충전 - 주문번호: ' || p_order_id, NOW());
END;
$$ LANGUAGE plpgsql;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
