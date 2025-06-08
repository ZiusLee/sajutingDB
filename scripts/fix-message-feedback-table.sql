-- Drop and recreate the message_feedback table with correct schema
DROP TABLE IF EXISTS message_feedback CASCADE;

CREATE TABLE message_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'retry', 'copy')),
  session_id TEXT, -- Store session identifier instead of user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX idx_message_feedback_session_id ON message_feedback(session_id);
CREATE INDEX idx_message_feedback_type ON message_feedback(feedback_type);
