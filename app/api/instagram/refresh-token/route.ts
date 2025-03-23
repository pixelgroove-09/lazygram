// app/api/instagram/refresh-token/route.ts

import { NextResponse } from "next/server"
import { getInstagramFromDB, updateInstagramInDB } from "@/lib/db"
import { getLongLivedToken, validateToken } from "@/lib/instagram"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Add security check
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.ADMIN_API_KEY

    if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
      return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing API key" }, { status: 401 })
    }

    console.log("Token refresh process started")

    // Get current Instagram settings
    const instagramSettings = await getInstagramFromDB()

    if (!instagramSettings.connected || !instagramSettings.accessToken) {
      return NextResponse.json({
        success: false,
        message: "No Instagram account connected or no token available",
      })
    }

    // Check if the token is valid
    const isValid = await validateToken(instagramSettings.accessToken)

    if (isValid) {
      console.log("Current token is still valid")
      return NextResponse.json({
        success: true,
        message: "Token is valid, no refresh needed",
        refreshed: false,
      })
    }

    // At this point, we know the token is invalid or expired
    console.log("Token is invalid or expired, attempting to refresh")

    try {
      // Get a new long-lived token using the existing token
      // Note: This might not work if the token is completely expired
      const newToken = await getLongLivedToken(instagramSettings.accessToken)

      // Update the token in the database
      await updateInstagramInDB({
        ...instagramSettings,
        accessToken: newToken,
      })

      console.log("Token refreshed successfully")
      return NextResponse.json({
        success: true,
        message: "Token refreshed successfully",
        refreshed: true,
      })
    } catch (refreshError) {
      console.error("Failed to refresh token:", refreshError)

      // If we can't refresh, mark the account as disconnected
      await updateInstagramInDB({
        ...instagramSettings,
        connected: false,
      })

      return NextResponse.json({
        success: false,
        message: "Failed to refresh token, account marked as disconnected",
        error: refreshError.message,
      })
    }
  } catch (error) {
    console.error("Error in token refresh process:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error in token refresh process",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

