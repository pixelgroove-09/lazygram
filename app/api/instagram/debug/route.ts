import { NextResponse } from "next/server"
import { isMockModeEnabled } from "@/lib/config"
import { getInstagramFromDB } from "@/lib/db"
import { validateToken } from "@/lib/instagram"

export async function GET(request: Request) {
  try {
    // Add security check
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.ADMIN_API_KEY

    if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing API key" }, { status: 401 })
    }

    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || "not set",
      USE_MOCK_INSTAGRAM: process.env.USE_MOCK_INSTAGRAM || "not set",
      INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "set" : "not set",
      INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "set" : "not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
    }

    // Check mock mode
    const mockMode = isMockModeEnabled()

    // Get Instagram settings
    let instagramSettings = null
    let tokenStatus = null

    try {
      instagramSettings = await getInstagramFromDB()

      // Check token if connected and not in mock mode
      if (instagramSettings.connected && instagramSettings.accessToken && !mockMode) {
        tokenStatus = await validateToken(instagramSettings.accessToken)
      }
    } catch (dbError) {
      return NextResponse.json({
        status: "error",
        message: "Failed to get Instagram settings from database",
        error: dbError.message,
        mockMode,
        environment: envCheck,
      })
    }

    return NextResponse.json({
      status: "success",
      mockMode,
      environment: envCheck,
      instagram: {
        connected: instagramSettings?.connected || false,
        accountName: instagramSettings?.accountName || null,
        accountId: instagramSettings?.accountId || null,
        hasAccessToken: !!instagramSettings?.accessToken,
        tokenValid: tokenStatus,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Instagram debug error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to get Instagram debug information",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

