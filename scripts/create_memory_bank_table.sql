-- Create memory_bank table if it doesn't exist
CREATE TABLE IF NOT EXISTS memory_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('conversation', 'preference', 'insight', 'context', 'compatibility', 'career', 'location', 'emotion', 'personal')),
    content JSONB NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memory_bank_user_id ON memory_bank(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_bank_session_id ON memory_bank(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_bank_type ON memory_bank(type);
CREATE INDEX IF NOT EXISTS idx_memory_bank_created_at ON memory_bank(created_at);

-- Add constraint to ensure either user_id or session_id is provided
ALTER TABLE memory_bank ADD CONSTRAINT check_user_or_session 
CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL));
