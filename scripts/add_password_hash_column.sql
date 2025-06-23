-- saju_sessions 테이블에 password_hash 컬럼 추가
ALTER TABLE saju_sessions 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_saju_sessions_email ON saju_sessions(email);
CREATE INDEX IF NOT EXISTS idx_saju_sessions_auth_user_id ON saju_sessions(auth_user_id);
