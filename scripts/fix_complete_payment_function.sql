-- complete_payment 함수를 더 안전하게 수정
CREATE OR REPLACE FUNCTION complete_payment(
  p_order_id VARCHAR(255),
  p_user_id UUID,
  p_coins INTEGER,
  p_payment_key VARCHAR(255),
  p_payment_data JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  order_updated BOOLEAN := FALSE;
  coins_updated BOOLEAN := FALSE;
BEGIN
  -- 결제 주문 상태 업데이트
  UPDATE payment_orders 
  SET 
    status = 'completed',
    payment_key = p_payment_key,
    payment_data = p_payment_data,
    updated_at = NOW()
  WHERE order_id = p_order_id;
  
  GET DIAGNOSTICS order_updated = FOUND;
  
  IF NOT order_updated THEN
    RAISE EXCEPTION '주문을 찾을 수 없습니다: %', p_order_id;
  END IF;

  -- 사용자 코인 추가
  INSERT INTO user_coins (user_id, coins, created_at, updated_at)
  VALUES (p_user_id, p_coins, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    coins = user_coins.coins + p_coins,
    updated_at = NOW();
    
  GET DIAGNOSTICS coins_updated = FOUND;

  -- 결과 반환
  result := jsonb_build_object(
    'success', true,
    'order_updated', order_updated,
    'coins_updated', coins_updated,
    'message', '결제 처리 완료'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 오류 발생 시 주문 상태를 실패로 변경
    UPDATE payment_orders 
    SET 
      status = 'failed',
      failure_reason = SQLERRM,
      updated_at = NOW()
    WHERE order_id = p_order_id;
    
    RAISE EXCEPTION '결제 처리 중 오류: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
