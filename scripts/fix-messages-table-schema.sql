-- Add session_id column to messages table and fix foreign key constraint
-- This resolves the "violates foreign key constraint messages_session_id_fkey" error

-- First, check if session_id column exists
DO $$ 
BEGIN
    -- Add session_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN session_id UUID;
        RAISE NOTICE 'Added session_id column to messages table';
    ELSE
        RAISE NOTICE 'session_id column already exists in messages table';
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_session_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES saju_sessions(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint messages_session_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint messages_session_id_fkey already exists';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

-- Update existing messages to link them to sessions via chat_rooms if possible
-- This handles orphaned messages that might exist
UPDATE messages 
SET session_id = cr.session_id
FROM chat_rooms cr 
WHERE messages.room_id = cr.id 
AND messages.session_id IS NULL;

-- Clean up any orphaned messages that can't be linked to a session
-- (Optional - comment out if you want to keep orphaned messages)
-- DELETE FROM messages WHERE session_id IS NULL;

RAISE NOTICE 'Messages table schema fix completed';
