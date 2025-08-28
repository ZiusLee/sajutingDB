-- 메시지 중복 저장 방지를 위한 RPC 함수 생성
CREATE OR REPLACE FUNCTION insert_messages_with_order(
  p_session_id TEXT,
  p_chat_room_id TEXT DEFAULT NULL,
  p_messages JSONB
)
RETURNS TABLE(id UUID) AS $$
DECLARE
  last_order INTEGER := 0;
  message_record JSONB;
  new_message_id UUID;
BEGIN
  -- 마지막 메시지 순서 조회 (원자적 처리)
  IF p_chat_room_id IS NOT NULL THEN
    SELECT COALESCE(MAX(message_order), 0) INTO last_order
    FROM messages 
    WHERE chat_room_id = p_chat_room_id::UUID;
  ELSE
    SELECT COALESCE(MAX(message_order), 0) INTO last_order
    FROM messages 
    WHERE session_id = p_session_id;
  END IF;

  -- 각 메시지를 순차적으로 삽입
  FOR message_record IN SELECT * FROM jsonb_array_elements(p_messages)
  LOOP
    last_order := last_order + 1;
    
    INSERT INTO messages (
      session_id,
      chat_room_id,
      role,
      content,
      message_order,
      room_type,
      model_used,
      response_time_ms,
      created_at
    ) VALUES (
      p_session_id,
      CASE WHEN p_chat_room_id IS NOT NULL THEN p_chat_room_id::UUID ELSE NULL END,
      (message_record->>'role')::TEXT,
      (message_record->>'content')::TEXT,
      last_order,
      COALESCE((message_record->>'room_type')::TEXT, 'sajuping'),
      (message_record->>'model_used')::TEXT,
      (message_record->>'response_time_ms')::INTEGER,
      COALESCE((message_record->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW())
    ) RETURNING messages.id INTO new_message_id;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 메시지 테이블에 중복 방지를 위한 인덱스 추가 (이미 있다면 무시)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_session_order 
ON messages(session_id, message_order);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chatroom_order 
ON messages(chat_room_id, message_order) 
WHERE chat_room_id IS NOT NULL;
