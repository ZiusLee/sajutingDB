-- Adds quality_score, is_low_quality, and semantic_hash to the smart_contexts table
-- and creates indexes for performance optimization.

-- Alter table to add new columns for quality management
ALTER TABLE smart_contexts
ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_low_quality BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS semantic_hash TEXT;

-- Add a comment to describe the purpose of the new columns
COMMENT ON COLUMN smart_contexts.quality_score IS 'A score from 0.0 to 1.0 indicating the quality and reliability of the memory.';
COMMENT ON COLUMN smart_contexts.is_low_quality IS 'A flag for quick filtering of low-quality memories (quality_score < 0.5).';
COMMENT ON COLUMN smart_contexts.semantic_hash IS 'A hash of the content for quick, non-vector-based duplicate checks.';

-- Create indexes to optimize queries based on quality and user
CREATE INDEX IF NOT EXISTS idx_quality_score ON smart_contexts(user_id, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_is_low_quality ON smart_contexts(user_id, is_low_quality);
CREATE INDEX IF NOT EXISTS idx_semantic_hash ON smart_contexts(user_id, semantic_hash);

-- Retroactively update quality scores for existing short memories
-- This helps clean up previously stored low-value data.
UPDATE smart_contexts
SET 
  quality_score = 0.3, 
  is_low_quality = true
WHERE 
  LENGTH(content) < 15 AND quality_score = 1.0;

-- Ensure the function for finding duplicates is up-to-date
-- (Assuming find_cross_type_duplicate and find_similar_memory exist from previous migrations)
-- No changes to functions needed for this migration.

-- Log completion
SELECT 'Memory schema upgrade v3 completed successfully.';
