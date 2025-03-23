import { type NextRequest, NextResponse } from "next/server"
import { getInstagramEnvironmentStatus } from "@/lib/instagram"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info("Checking Instagram environment variables")

    const status = getInstagramEnvironmentStatus()

    const missingVars = []
    if (status.INSTAGRAM_APP_ID === "Not set") {
      missingVars.push("INSTAGRAM_APP_ID")
    }
    if (status.INSTAGRAM_APP_SECRET === "Not set") {
      missingVars.push("INSTAGRAM_APP_SECRET")
    }
    if (status.NEXT_PUBLIC_APP_URL === "Not set") {
      missingVars.push("NEXT_PUBLIC_APP_URL")
    }

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required environment variables: ${missingVars.join(", ")}`,
        details: status,
      })
    }

    return NextResponse.json({
      success: true,
      message: "All required environment variables are set",
      details: status,
    })
  } catch (error) {
    logger.error("Error checking environment variables:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

