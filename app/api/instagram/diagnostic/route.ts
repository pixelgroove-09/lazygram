import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("Instagram diagnostic endpoint called")

    // Check authentication
    const adminKey = process.env.ADMIN_API_KEY
    const requestKey = request.headers.get("x-admin-key")

    console.log("Admin key check:", !!adminKey, "Request key provided:", !!requestKey)

    // Don't log the actual keys for security reasons
    const isAdmin = adminKey ? requestKey === adminKey : true

    if (!isAdmin) {
      console.log("Authentication failed")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing API key",
        },
        { status: 401 },
      )
    }

    console.log("Authentication successful, checking environment")

    // Check environment variables first
    const envCheck = {
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "Set" : "Not set",
      INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "Set" : "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Not set",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "Set" : "Not set",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
    }

    // Check for missing required environment variables
    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, value]) => value === "Not set")
      .map(([key]) => key)

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "Missing environment variables",
          missingVariables: missingEnvVars,
          message: `The following environment variables are missing: ${missingEnvVars.join(", ")}`,
        },
        { status: 500 },
      )
    }

    console.log("Environment variables check passed, testing database connection")

    // Test database connection
    let dbConnectionStatus = "unknown"
    let instagramSettings = null

    try {
      const supabase = createServerClient()

      // Simple query to test connection
      const { data, error } = await supabase.from("instagram_settings").select("*").limit(1)

      if (error) {
        throw error
      }

      dbConnectionStatus = "connected"
      instagramSettings = data && data.length > 0 ? data[0] : null

      console.log("Database connection successful")
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      dbConnectionStatus = "error"

      return NextResponse.json(
        {
          status: "error",
          error: "Database connection failed",
          message: dbError.message || "Could not connect to the database",
          details: process.env.NODE_ENV === "development" ? dbError : undefined,
          environment: envCheck,
        },
        { status: 500 },
      )
    }

    // Return diagnostic information
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbConnectionStatus,
        instagramConnected: instagramSettings ? instagramSettings.connected : false,
        instagramAccountName: instagramSettings ? instagramSettings.account_name : null,
      },
    })
  } catch (error) {
    console.error("Instagram diagnostic error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: "Diagnostic failed",
        message: error.message || "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

