-- Create system_logs table for general application logging
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posting_logs table for Instagram posting activity
CREATE TABLE IF NOT EXISTS posting_logs (
  id SERIAL PRIMARY KEY,
  image_id TEXT REFERENCES images(id),
  success BOOLEAN NOT NULL,
  instagram_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add instagram_post_id column to images table
ALTER TABLE images ADD COLUMN IF NOT EXISTS instagram_post_id TEXT;

-- Create index on posting_logs for faster queries
CREATE INDEX IF NOT EXISTS idx_posting_logs_image_id ON posting_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_posting_logs_success ON posting_logs(success);
CREATE INDEX IF NOT EXISTS idx_posting_logs_created_at ON posting_logs(created_at);

-- Create index on system_logs for faster queries
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

