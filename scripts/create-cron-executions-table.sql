-- Create table to track cron job executions for monitoring
CREATE TABLE IF NOT EXISTS cron_executions (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  execution_date DATE NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  free_users INTEGER DEFAULT 0,
  subscription_users INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL, -- 'completed', 'completed_with_errors', 'failed'
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_cron_executions_job_date 
ON cron_executions(job_name, execution_date DESC);

-- Create index for status monitoring
CREATE INDEX IF NOT EXISTS idx_cron_executions_status 
ON cron_executions(status, execution_time DESC);
