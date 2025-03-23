import { type NextRequest, NextResponse } from "next/server"
import { createInstagramApiClient } from "@/lib/instagram-api"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info("Testing Instagram connection")

    try {
      // Try to create an API client (this will throw if not connected)
      await createInstagramApiClient()

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Instagram API",
      })
    } catch (error) {
      logger.warn("Instagram connection test failed:", error)

      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect to Instagram API",
        details: error instanceof Error ? error.stack : undefined,
      })
    }
  } catch (error) {
    logger.error("Error in test connection API:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

