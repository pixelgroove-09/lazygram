-- Add rate_limited column to posting_logs table
ALTER TABLE posting_logs ADD COLUMN IF NOT EXISTS rate_limited BOOLEAN DEFAULT FALSE;

-- Add app_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values for Instagram app credentials if they don't exist
INSERT INTO app_config (key, value) 
VALUES ('instagram_app_id', '') 
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_config (key, value) 
VALUES ('instagram_app_secret', '') 
ON CONFLICT (key) DO NOTHING;

