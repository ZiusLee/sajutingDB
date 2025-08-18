-- 다운그레이드 예약 테이블 생성
CREATE TABLE IF NOT EXISTS subscription_downgrades (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  current_plan VARCHAR(50) NOT NULL,
  new_plan VARCHAR(50) NOT NULL,
  new_plan_name VARCHAR(100) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subscription_downgrades_user_id ON subscription_downgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_downgrades_status ON subscription_downgrades(status);
CREATE INDEX IF NOT EXISTS idx_subscription_downgrades_scheduled_date ON subscription_downgrades(scheduled_date);
