-- subscription_charges 테이블에 다운그레이드 관련 컬럼 추가
ALTER TABLE subscription_charges 
ADD COLUMN IF NOT EXISTS scheduled_plan_change VARCHAR(50),
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS change_type VARCHAR(20) DEFAULT 'charge',
ADD COLUMN IF NOT EXISTS current_plan VARCHAR(50);

-- 기존 subscription_downgrades 데이터를 subscription_charges로 마이그레이션
INSERT INTO subscription_charges (
  user_id, 
  scheduled_plan_change, 
  scheduled_date, 
  change_type, 
  current_plan, 
  status, 
  created_at
)
SELECT 
  user_id::uuid,
  new_plan,
  scheduled_date,
  'downgrade',
  current_plan,
  status,
  created_at
FROM subscription_downgrades
WHERE status = 'pending';

-- subscription_downgrades 테이블 제거
DROP TABLE IF EXISTS subscription_downgrades;
