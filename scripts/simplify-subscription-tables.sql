-- 구독 테이블 단순화: subscription_charges 제거하고 user_coins에 통합
-- 1. user_coins 테이블에 다운그레이드 관련 컬럼 추가
ALTER TABLE user_coins 
ADD COLUMN IF NOT EXISTS scheduled_plan_change VARCHAR(50),
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP;

-- 2. 기존 subscription_charges 데이터를 user_coins로 마이그레이션 (다운그레이드 예약만)
UPDATE user_coins 
SET 
    scheduled_plan_change = sc.scheduled_plan_change,
    scheduled_date = sc.scheduled_date
FROM subscription_charges sc 
WHERE user_coins.user_id = sc.user_id 
    AND sc.change_type = 'downgrade' 
    AND sc.status = 'pending';

-- 3. subscription_charges 테이블 제거
DROP TABLE IF EXISTS subscription_charges;

-- 4. 데이터 확인
SELECT 
    user_id,
    subscription_plan,
    scheduled_plan_change,
    scheduled_date,
    last_daily_charge
FROM user_coins 
WHERE scheduled_plan_change IS NOT NULL;

-- 완료 메시지
SELECT 'Subscription tables simplified successfully' as result;
