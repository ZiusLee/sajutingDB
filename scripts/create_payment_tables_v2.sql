-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;

-- 결제 주문 테이블
CREATE TABLE payment_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    coins INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_key VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES payment_orders(order_id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50),
    payment_key VARCHAR(200),
    toss_payment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created_at ON payment_orders(created_at);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at);

-- 결제 성공 처리 함수
CREATE OR REPLACE FUNCTION process_payment_success(
    p_order_id VARCHAR(100),
    p_user_id UUID,
    p_coins INTEGER,
    p_payment_key VARCHAR(200),
    p_toss_payment_data JSONB
) RETURNS VOID AS $$
DECLARE
    v_order_exists BOOLEAN;
    v_current_coins INTEGER;
BEGIN
    -- 주문 존재 확인
    SELECT EXISTS(
        SELECT 1 FROM payment_orders 
        WHERE order_id = p_order_id AND user_id = p_user_id AND status = 'pending'
    ) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RAISE EXCEPTION '유효하지 않은 주문입니다.';
    END IF;
    
    -- 트랜잭션 시작
    BEGIN
        -- 주문 상태 업데이트
        UPDATE payment_orders 
        SET 
            status = 'completed',
            payment_key = p_payment_key,
            updated_at = NOW()
        WHERE order_id = p_order_id;
        
        -- 결제 내역 저장
        INSERT INTO payment_history (
            order_id, user_id, coins, amount, payment_method, 
            payment_key, toss_payment_data
        )
        SELECT 
            p_order_id, p_user_id, coins, amount, 'card',
            p_payment_key, p_toss_payment_data
        FROM payment_orders 
        WHERE order_id = p_order_id;
        
        -- 사용자 코인 업데이트
        SELECT coins INTO v_current_coins FROM user_coins WHERE user_id = p_user_id;
        
        IF v_current_coins IS NULL THEN
            -- 사용자 코인 레코드가 없으면 생성
            INSERT INTO user_coins (user_id, coins, updated_at)
            VALUES (p_user_id, p_coins, NOW());
        ELSE
            -- 기존 코인에 추가
            UPDATE user_coins 
            SET 
                coins = coins + p_coins,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- 오류 발생 시 롤백
        RAISE EXCEPTION '결제 처리 중 오류가 발생했습니다: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- 결제 실패 처리 함수
CREATE OR REPLACE FUNCTION process_payment_failure(
    p_order_id VARCHAR(100),
    p_failure_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE payment_orders 
    SET 
        status = 'failed',
        updated_at = NOW()
    WHERE order_id = p_order_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 정보만 조회 가능
CREATE POLICY "Users can view own payment orders" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- 서비스는 모든 작업 가능 (API에서 사용)
CREATE POLICY "Service can manage payment orders" ON payment_orders
    FOR ALL USING (true);

CREATE POLICY "Service can manage payment history" ON payment_history
    FOR ALL USING (true);
