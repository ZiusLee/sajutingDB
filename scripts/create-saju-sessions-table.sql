-- Create saju_sessions table for tracking user sessions and analytics
CREATE TABLE IF NOT EXISTS saju_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    room_type TEXT NOT NULL,
    user_name TEXT,
    birth_year INTEGER,
    birth_month INTEGER,
    birth_day INTEGER,
    birth_hour INTEGER,
    gender TEXT,
    day_stem TEXT,
    day_branch TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saju_sessions_session_id ON saju_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_saju_sessions_room_type ON saju_sessions(room_type);
CREATE INDEX IF NOT EXISTS idx_saju_sessions_created_at ON saju_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_saju_sessions_day_stem ON saju_sessions(day_stem);

-- Add RLS (Row Level Security) if needed
ALTER TABLE saju_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on saju_sessions" ON saju_sessions
    FOR ALL USING (true);
