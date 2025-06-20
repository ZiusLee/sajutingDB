-- Assumes a users table exists for the foreign key user_id
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For gen_random_uuid() if not enabled

CREATE TABLE IF NOT EXISTS memory_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NULLABLE, -- For authenticated users
    session_id TEXT NULLABLE, -- For anonymous users
    type TEXT NOT NULL CHECK (type IN ('conversation', 'preference', 'insight', 'context')),
    content JSONB NOT NULL,
    tags TEXT[] NULLABLE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_memory_bank_user_id ON memory_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_bank_session_id ON memory_bank(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_bank_type ON memory_bank(type);
CREATE INDEX IF NOT EXISTS idx_memory_bank_tags ON memory_bank USING GIN(tags); -- If you search by tags often
