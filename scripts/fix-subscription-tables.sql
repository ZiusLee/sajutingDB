-- 구독 테이블 관계 분석 및 수정 통합 스크립트

-- 1. 현재 테이블 상태 분석
DO $$
BEGIN
    RAISE NOTICE '=== 구독 테이블 관계 분석 시작 ===';
    
    -- user_coins 테이블 구독 정보 확인
    RAISE NOTICE '1. user_coins 테이블 구독 사용자 수: %', 
        (SELECT COUNT(*) FROM user_coins WHERE subscription_plan IS NOT NULL);
    
    -- payment_orders 테이블 구독 주문 확인
    RAISE NOTICE '2. payment_orders 테이블 구독 주문 수: %', 
        (SELECT COUNT(*) FROM payment_orders WHERE subscription_type IS NOT NULL);
    
    -- subscription_charges 테이블 레코드 확인
    RAISE NOTICE '3. subscription_charges 테이블 레코드 수: %', 
        (SELECT COUNT(*) FROM subscription_charges);
    
    -- 데이터 불일치 확인
    RAISE NOTICE '4. 구독 정보 불일치 사용자 수: %',
        (SELECT COUNT(*) FROM user_coins uc 
         LEFT JOIN payment_orders po ON uc.user_id = po.user_id 
         WHERE uc.subscription_plan IS NOT NULL 
         AND (po.subscription_type IS NULL OR po.subscription_type != uc.subscription_plan));
END $$;

-- 2. 데이터 정리 및 수정
-- 고아 레코드 정리
DELETE FROM subscription_charges 
WHERE subscription_order_id NOT IN (SELECT id FROM payment_orders);

-- user_coins와 payment_orders 구독 정보 동기화
UPDATE user_coins 
SET subscription_plan = po.subscription_type,
    subscription_start_date = po.created_at,
    subscription_end_date = po.next_billing_date
FROM payment_orders po 
WHERE user_coins.user_id = po.user_id 
AND po.subscription_type IS NOT NULL 
AND po.subscription_status = 'active'
AND (user_coins.subscription_plan IS NULL OR user_coins.subscription_plan != po.subscription_type);

-- 만료된 구독 정리
UPDATE user_coins 
SET subscription_plan = NULL,
    subscription_start_date = NULL,
    subscription_end_date = NULL,
    subscription_coins = 0
WHERE subscription_end_date < NOW() 
AND subscription_plan IS NOT NULL;

-- payment_orders에서도 만료된 구독 상태 업데이트
UPDATE payment_orders 
SET subscription_status = 'expired'
WHERE next_billing_date < NOW() 
AND subscription_status = 'active';

-- 3. 데이터 일관성 검증
DO $$
BEGIN
    RAISE NOTICE '=== 수정 후 상태 확인 ===';
    
    RAISE NOTICE '1. 활성 구독 사용자 수 (user_coins): %', 
        (SELECT COUNT(*) FROM user_coins WHERE subscription_plan IS NOT NULL);
    
    RAISE NOTICE '2. 활성 구독 주문 수 (payment_orders): %', 
        (SELECT COUNT(*) FROM payment_orders WHERE subscription_status = 'active');
    
    RAISE NOTICE '3. 정리된 subscription_charges 레코드 수: %', 
        (SELECT COUNT(*) FROM subscription_charges);
    
    RAISE NOTICE '4. 데이터 일관성 확인 완료';
    RAISE NOTICE '=== 구독 테이블 수정 완료 ===';
END $$;
