import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const mockMode = process.env.USE_MOCK_INSTAGRAM === "true"

    return NextResponse.json({
      enabled: mockMode,
      details: mockMode
        ? "Mock mode is enabled. Instagram API calls will be simulated."
        : "Mock mode is disabled. Real Instagram API calls will be made.",
    })
  } catch (error) {
    console.error("Error checking mock mode:", error)
    return NextResponse.json({ enabled: false, details: "An unexpected error occurred" }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    // Verify admin API key
    const adminKey = request.headers.get("X-Admin-Key")

    if (!adminKey) {
      logger.warn("Attempt to toggle mock mode without admin key")
      return NextResponse.json(
        {
          success: false,
          message: "Admin API key is required",
        },
        { status: 401 },
      )
    }

    if (adminKey !== process.env.ADMIN_API_KEY) {
      logger.warn("Attempt to toggle mock mode with invalid admin key")
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin API key",
        },
        { status: 401 },
      )
    }

    // Get request body
    const body = await request.json()
    const { mockMode } = body

    if (typeof mockMode !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "mockMode must be a boolean",
        },
        { status: 400 },
      )
    }

    logger.info("Toggling Instagram mock mode", { mockMode })

    // Update the environment variable
    process.env.USE_MOCK_INSTAGRAM = mockMode ? "true" : "false"

    // Update the database setting
    const supabase = createServerClient()
    await supabase
      .from("app_config")
      .upsert({ key: "use_mock_instagram", value: mockMode ? "true" : "false" }, { onConflict: "key" })

    logger.info("Mock mode updated successfully", { mockMode })

    return NextResponse.json({
      success: true,
      mockMode,
    })
  } catch (error) {
    logger.error("Error toggling mock mode", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error toggling mock mode",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

