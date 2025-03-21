import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Basic environment check
    const envCheck = {
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "Set" : "Not set",
      INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "Set" : "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      ADMIN_API_KEY: process.env.ADMIN_API_KEY ? "Set" : "Not set",
      SUPABASE_URL: process.env.SUPABASE_URL ? "Set" : "Not set",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "Set" : "Not set",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
    }

    return NextResponse.json({
      status: "success",
      message: "Basic diagnostic completed successfully",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      requestHeaders: {
        host: request.headers.get("host"),
        userAgent: request.headers.get("user-agent"),
        adminKey: request.headers.has("x-admin-key") ? "Provided" : "Not provided",
      },
    })
  } catch (error) {
    console.error("Simple diagnostic error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: "Diagnostic failed",
        message: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

