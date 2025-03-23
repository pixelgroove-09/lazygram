import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    // Add security check
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.ADMIN_API_KEY

    if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing API key" }, { status: 401 })
    }

    logger.info("Database initialization started")
    const supabase = createServerClient()

    // Create instagram_settings table if it doesn't exist
    const createInstagramSettingsQuery = `
      CREATE TABLE IF NOT EXISTS instagram_settings (
        id SERIAL PRIMARY KEY,
        connected BOOLEAN DEFAULT false,
        account_name TEXT,
        account_id TEXT,
        access_token TEXT,
        profile_picture TEXT
      );
    `

    // Create schedule_settings table if it doesn't exist
    const createScheduleSettingsQuery = `
      CREATE TABLE IF NOT EXISTS schedule_settings (
        id SERIAL PRIMARY KEY,
        enabled BOOLEAN DEFAULT false,
        frequency TEXT DEFAULT 'daily',
        time TEXT DEFAULT '12:00',
        days_of_week INTEGER[] DEFAULT '{1,3,5}',
        custom_days INTEGER DEFAULT 2
      );
    `

    // Create images table if it doesn't exist
    const createImagesQuery = `
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        caption TEXT,
        hashtags TEXT[],
        prompt TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        scheduled BOOLEAN DEFAULT false,
        scheduled_time TIMESTAMP WITH TIME ZONE,
        posted_at TIMESTAMP WITH TIME ZONE,
        instagram_post_id TEXT
      );
    `

    // Create saved_prompts table if it doesn't exist
    const createSavedPromptsQuery = `
      CREATE TABLE IF NOT EXISTS saved_prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create system_logs table if it doesn't exist
    const createSystemLogsQuery = `
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        level VARCHAR(10) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create posting_logs table if it doesn't exist
    const createPostingLogsQuery = `
      CREATE TABLE IF NOT EXISTS posting_logs (
        id SERIAL PRIMARY KEY,
        image_id TEXT REFERENCES images(id),
        success BOOLEAN NOT NULL,
        instagram_post_id TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Add this query to the existing queries
    const createAppConfigQuery = `
      CREATE TABLE IF NOT EXISTS app_config (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute all queries
    try {
      await supabase.rpc("execute_sql", { query: createInstagramSettingsQuery })
      await supabase.rpc("execute_sql", { query: createScheduleSettingsQuery })
      await supabase.rpc("execute_sql", { query: createImagesQuery })
      await supabase.rpc("execute_sql", { query: createSavedPromptsQuery })
      await supabase.rpc("execute_sql", { query: createSystemLogsQuery })
      await supabase.rpc("execute_sql", { query: createPostingLogsQuery })
      // Add this to the execute queries section
      await supabase.rpc("execute_sql", { query: createAppConfigQuery })

      // Create indexes
      await supabase.rpc("execute_sql", {
        query: `
          CREATE INDEX IF NOT EXISTS idx_posting_logs_image_id ON posting_logs(image_id);
          CREATE INDEX IF NOT EXISTS idx_posting_logs_success ON posting_logs(success);
          CREATE INDEX IF NOT EXISTS idx_posting_logs_created_at ON posting_logs(created_at);
          CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
          CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
        `,
      })

      // Add this after the other table creation queries
      // Insert default configuration if it doesn't exist
      await supabase.rpc("execute_sql", {
        query: `
          INSERT INTO app_config (key, value)
          VALUES ('USE_MOCK_INSTAGRAM', 'true')
          ON CONFLICT (key) DO NOTHING;
        `,
      })

      logger.info("Database tables created successfully")
    } catch (sqlError) {
      logger.error("Error executing SQL:", sqlError)

      // Try an alternative approach if RPC fails
      try {
        // Check if instagram_settings table exists
        const { error: checkError } = await supabase.from("instagram_settings").select("id").limit(1)

        if (checkError) {
          logger.info("instagram_settings table doesn't exist, initializing default record")

          // Create default record in instagram_settings
          const { error: insertError } = await supabase.from("instagram_settings").insert({
            id: 1,
            connected: false,
            account_name: "",
            account_id: "",
            access_token: "",
            profile_picture: "",
          })

          if (insertError) {
            logger.error("Error inserting default Instagram settings:", insertError)
          }
        }

        // Check if schedule_settings table exists
        const { error: scheduleCheckError } = await supabase.from("schedule_settings").select("id").limit(1)

        if (scheduleCheckError) {
          logger.info("schedule_settings table doesn't exist, initializing default record")

          // Create default record in schedule_settings
          const { error: insertError } = await supabase.from("schedule_settings").insert({
            id: 1,
            enabled: false,
            frequency: "daily",
            time: "12:00",
            days_of_week: [1, 3, 5],
            custom_days: 2,
          })

          if (insertError) {
            logger.error("Error inserting default schedule settings:", insertError)
          }
        }
      } catch (altError) {
        logger.error("Alternative initialization approach failed:", altError)
        return NextResponse.json(
          {
            error: "database_init_failed",
            message: "Failed to initialize database tables",
            details: altError.message,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    logger.error("Database initialization error:", error)
    return NextResponse.json(
      {
        error: "init_failed",
        message: error.message || "Failed to initialize database",
      },
      { status: 500 },
    )
  }
}

