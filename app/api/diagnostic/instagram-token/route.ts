import { NextResponse } from "next/server"
import { getInstagramFromDB } from "@/lib/db"
import { validateToken } from "@/lib/instagram"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    // Add security check
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.ADMIN_API_KEY

    if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing API key" }, { status: 401 })
    }

    // Get Instagram settings
    const instagramSettings = await getInstagramFromDB()

    // Check if connected
    if (!instagramSettings.connected) {
      return NextResponse.json({
        status: "not_connected",
        message: "Instagram account is not connected",
        environment: {
          INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "Set" : "Not set",
          INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "Set" : "Not set",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
          INSTAGRAM_WEBHOOK_VERIFY_TOKEN: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? "Set" : "Not set",
        },
      })
    }

    // Check if token exists
    if (!instagramSettings.accessToken) {
      return NextResponse.json({
        status: "no_token",
        message: "Instagram account is connected but no access token is available",
        accountName: instagramSettings.accountName,
        accountId: instagramSettings.accountId,
      })
    }

    // Validate token
    const isTokenValid = await validateToken(instagramSettings.accessToken)

    return NextResponse.json({
      status: isTokenValid ? "valid" : "invalid",
      message: isTokenValid ? "Access token is valid" : "Access token is invalid or expired",
      accountName: instagramSettings.accountName,
      accountId: instagramSettings.accountId,
      tokenLength: instagramSettings.accessToken.length,
      tokenPrefix: instagramSettings.accessToken.substring(0, 10) + "...",
      environment: {
        INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "Set" : "Not set",
        INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "Set" : "Not set",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? "Set" : "Not set",
      },
    })
  } catch (error) {
    logger.error("Instagram token diagnostic error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Instagram token",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

