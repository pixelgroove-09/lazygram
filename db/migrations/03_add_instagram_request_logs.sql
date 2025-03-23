-- Create instagram_request_logs table for storing API request logs
CREATE TABLE IF NOT EXISTS instagram_request_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  body JSONB,
  response JSONB,
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_instagram_request_logs_timestamp ON instagram_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_instagram_request_logs_type ON instagram_request_logs(type);

