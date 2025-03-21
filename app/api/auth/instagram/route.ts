import { type NextRequest, NextResponse } from "next/server"
import { getInstagramAuthUrl } from "@/lib/instagram"

export async function GET(request: NextRequest) {
  try {
    console.log("Instagram auth route called")

    // Check if we should use mock mode
    const useMock = process.env.NODE_ENV === "development" || process.env.USE_MOCK_INSTAGRAM === "true"

    if (useMock) {
      console.log("Using mock Instagram authentication")
      // Instead of redirecting to Facebook, redirect to our mock callback
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/mock-callback`)
    }

    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID) {
      console.error("INSTAGRAM_APP_ID environment variable is not set")
      return NextResponse.json(
        {
          error: "configuration_error",
          message: "Instagram App ID is not configured",
        },
        { status: 500 },
      )
    }

    if (!process.env.INSTAGRAM_APP_SECRET) {
      console.error("INSTAGRAM_APP_SECRET environment variable is not set")
      return NextResponse.json(
        {
          error: "configuration_error",
          message: "Instagram App Secret is not configured",
        },
        { status: 500 },
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.json(
        {
          error: "configuration_error",
          message: "App URL is not configured",
        },
        { status: 500 },
      )
    }

    try {
      const authUrl = await getInstagramAuthUrl()
      console.log("Generated Instagram auth URL:", authUrl)

      // Redirect directly to the auth URL
      return NextResponse.redirect(authUrl)
    } catch (authUrlError: any) {
      console.error("Error generating Instagram auth URL:", authUrlError)
      return NextResponse.json(
        {
          error: "auth_url_generation_failed",
          message: authUrlError.message || "Failed to generate Instagram authorization URL",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Instagram auth error:", error)

    // Return error as JSON
    return NextResponse.json(
      {
        error: "auth_init_failed",
        message: error.message || "Unknown error",
        debug: JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}

