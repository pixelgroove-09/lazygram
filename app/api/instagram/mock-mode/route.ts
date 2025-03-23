import { type NextRequest, NextResponse } from "next/server"
import { setMockMode } from "@/lib/instagram-api"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Check for admin API key
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized mock mode change attempt")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Parse request body
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Bad Request", message: "Enabled parameter must be a boolean" },
        { status: 400 },
      )
    }

    // Set mock mode
    await setMockMode(enabled)

    logger.info(`Instagram mock mode ${enabled ? "enabled" : "disabled"}`)

    return NextResponse.json({
      success: true,
      mockMode: enabled,
    })
  } catch (error) {
    logger.error("Error setting mock mode:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

