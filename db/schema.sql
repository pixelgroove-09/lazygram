-- Create users table
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instagram_settings table
CREATE TABLE IF NOT EXISTS instagram_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  connected BOOLEAN DEFAULT false,
  account_name VARCHAR(255),
  account_id VARCHAR(255),
  access_token TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_settings table
CREATE TABLE IF NOT EXISTS schedule_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  frequency VARCHAR(20) DEFAULT 'daily',
  time VARCHAR(10) DEFAULT '12:00',
  days_of_week INTEGER[] DEFAULT '{1,3,5}',
  custom_days INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE
);

-- Create saved_prompts table
CREATE TABLE IF NOT EXISTS saved_prompts (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_scheduled ON images(scheduled);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);

