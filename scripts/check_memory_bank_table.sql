-- Check if memory_bank table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'memory_bank'
ORDER BY ordinal_position;

-- Check if there are any records in the table
SELECT COUNT(*) as total_records FROM memory_bank;

-- Show sample records if any exist
SELECT * FROM memory_bank LIMIT 5;
