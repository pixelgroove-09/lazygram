import { type NextRequest, NextResponse } from "next/server"
import { getInstagramAuthUrl } from "@/lib/instagram"

export async function GET(request: NextRequest) {
  try {
    console.log("Instagram auth route called")

    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID) {
      console.error("INSTAGRAM_APP_ID environment variable is not set")
      return NextResponse.json({ error: "Instagram App ID is not configured" }, { status: 500 })
    }

    if (!process.env.INSTAGRAM_APP_SECRET) {
      console.error("INSTAGRAM_APP_SECRET environment variable is not set")
      return NextResponse.json({ error: "Instagram App Secret is not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.json({ error: "App URL is not configured" }, { status: 500 })
    }

    const authUrl = await getInstagramAuthUrl()
    console.log("Redirecting to Instagram auth URL")

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Instagram auth error:", error)

    // Redirect back to settings with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/settings?error=auth_init_failed&error_description=${encodeURIComponent(error.message || "Unknown error")}`,
    )
  }
}

