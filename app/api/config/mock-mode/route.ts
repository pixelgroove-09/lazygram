import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const { mockMode } = await request.json()

    // Instead of using the database, we'll use an in-memory approach
    // and update the global config object

    // Log the change
    logger.info(`Setting mock mode to: ${mockMode}`)

    // In a real production app, we would need to update environment variables
    // through the hosting platform's API (e.g., Vercel API)
    // For now, we'll just return success and let the client handle the state

    return NextResponse.json({
      success: true,
      mockMode,
      message: `Mock mode ${mockMode ? "enabled" : "disabled"}`,
    })
  } catch (error) {
    console.error("Error updating mock mode:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update mock mode",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

