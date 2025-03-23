-- Create app_config table for application configuration
CREATE TABLE IF NOT EXISTS app_config (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO app_config (key, value)
VALUES ('USE_MOCK_INSTAGRAM', 'true')
ON CONFLICT (key) DO NOTHING;

