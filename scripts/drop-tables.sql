-- Drop tables in correct order to avoid foreign key constraint issues
-- Drop dependent tables first, then parent tables

-- Drop messages table first (depends on chat_rooms)
DROP TABLE IF EXISTS messages CASCADE;

-- Drop chat_rooms table
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- Drop saju_profiles table
DROP TABLE IF EXISTS saju_profiles CASCADE;

-- Drop user_saju_info table (if it exists)
DROP TABLE IF EXISTS user_saju_info CASCADE;

-- Verify tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'chat_rooms', 'saju_profiles', 'user_saju_info');
