import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Add security check - only allow this in development or with admin key
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.ADMIN_API_KEY
    const isDev = process.env.NODE_ENV === "development"

    // In production, require authentication
    if (!isDev && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "This endpoint requires authentication in production" },
        { status: 401 },
      )
    }

    // Get relevant environment variables
    const envInfo = {
      // Instagram related
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID || "not set",
      INSTAGRAM_APP_ID_LENGTH: process.env.INSTAGRAM_APP_ID ? process.env.INSTAGRAM_APP_ID.length : 0,
      INSTAGRAM_APP_ID_TRIMMED: process.env.INSTAGRAM_APP_ID ? process.env.INSTAGRAM_APP_ID.trim() : "not set",
      INSTAGRAM_APP_SECRET_SET: process.env.INSTAGRAM_APP_SECRET ? "set (hidden)" : "not set",

      // App URL
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",

      // Environment
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL_ENV: process.env.VERCEL_ENV || "not set",

      // Other relevant variables
      INSTAGRAM_WEBHOOK_VERIFY_TOKEN_SET: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? "set (hidden)" : "not set",
      USE_MOCK_INSTAGRAM: process.env.USE_MOCK_INSTAGRAM || "not set",
    }

    // Use console.log instead of logger
    if (process.env.ENABLE_CONSOLE_LOGS === "true") {
      console.log("Environment debug endpoint called")
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
    })
  } catch (error) {
    // Use console.error instead of logger
    console.error("Environment debug error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

