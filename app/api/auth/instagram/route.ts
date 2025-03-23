import { type NextRequest, NextResponse } from "next/server"
import { getInstagramAuthUrl } from "@/lib/instagram"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info("Instagram auth route called")
    logger.info("Environment mode:", process.env.NODE_ENV)

    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID) {
      logger.error("INSTAGRAM_APP_ID environment variable is not set")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=configuration_error&error_description=${encodeURIComponent("Instagram App ID is not configured")}`,
      )
    }

    if (!process.env.INSTAGRAM_APP_SECRET) {
      logger.error("INSTAGRAM_APP_SECRET environment variable is not set")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=configuration_error&error_description=${encodeURIComponent("Instagram App Secret is not configured")}`,
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/settings?error=configuration_error&error_description=${encodeURIComponent("App URL is not configured")}`,
      )
    }

    try {
      const authUrl = await getInstagramAuthUrl()
      logger.info("Generated Instagram auth URL:", authUrl)

      // Redirect directly to the auth URL
      return NextResponse.redirect(authUrl)
    } catch (authUrlError: any) {
      logger.error("Error generating Instagram auth URL:", authUrlError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_url_generation_failed&error_description=${encodeURIComponent(authUrlError.message || "Failed to generate Instagram authorization URL")}`,
      )
    }
  } catch (error: any) {
    logger.error("Instagram auth error:", error)

    // Return a redirect with detailed error information
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_init_failed&error_description=${encodeURIComponent(error.message || "Unknown error")}&error_debug=${encodeURIComponent(
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
        }),
      )}`,
    )
  }
}

