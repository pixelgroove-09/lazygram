import { NextResponse } from "next/server"

export async function GET() {
  // Basic environment info that's safe to expose
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || "not set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not set",
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
    // Only indicate if these are set, not their values
    INSTAGRAM_APP_ID_SET: process.env.INSTAGRAM_APP_ID ? "yes" : "no",
    INSTAGRAM_APP_SECRET_SET: process.env.INSTAGRAM_APP_SECRET ? "yes" : "no",
    INSTAGRAM_WEBHOOK_TOKEN_SET: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? "yes" : "no",
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    message: "Basic environment check",
    environment: envInfo,
  })
}

