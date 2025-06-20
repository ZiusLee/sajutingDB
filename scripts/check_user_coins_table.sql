-- user_coins 테이블 구조 확인 및 수정
-- 기존 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_coins' 
ORDER BY ordinal_position;

-- user_coins 테이블이 올바른 구조인지 확인하고 필요시 재생성
DROP TABLE IF EXISTS user_coins CASCADE;

CREATE TABLE user_coins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER DEFAULT 0 NOT NULL CHECK (coins >= 0),
  last_check_in DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 데이터가 있다면 복원 (필요시)
-- INSERT INTO user_coins (user_id, coins, created_at, updated_at)
-- SELECT DISTINCT user_id, 985, NOW(), NOW() FROM payment_orders WHERE user_id IS NOT NULL
-- ON CONFLICT (user_id) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON user_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coins_updated_at ON user_coins(updated_at);
