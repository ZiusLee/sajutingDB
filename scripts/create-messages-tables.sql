-- Create messages table connected to saju_sessions
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES saju_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    room_type TEXT,
    model_used TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_feedback table for tracking user feedback
CREATE TABLE IF NOT EXISTS message_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'retry', 'copy')),
    user_id UUID REFERENCES saju_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_type ON message_feedback(feedback_type);

-- Add RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM saju_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM saju_sessions 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Message feedback policies
CREATE POLICY "Users can view their own message feedback" ON message_feedback
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN saju_sessions s ON m.session_id = s.id
            WHERE s.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own message feedback" ON message_feedback
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN saju_sessions s ON m.session_id = s.id
            WHERE s.auth_user_id = auth.uid()
        )
    );
