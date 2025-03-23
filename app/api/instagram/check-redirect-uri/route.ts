import { NextResponse } from "next/server"

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const valid = !!appUrl

    let details = ""
    if (!appUrl) {
      details =
        "NEXT_PUBLIC_APP_URL environment variable is missing. This is required for proper redirect URI configuration."
    } else {
      const redirectUri = `${appUrl}/api/auth/instagram/callback`
      details = `Your redirect URI is: ${redirectUri}. Make sure this exact URL is added to the Valid OAuth Redirect URIs in your Facebook App settings.`
    }

    return NextResponse.json({ valid, details })
  } catch (error) {
    console.error("Error checking redirect URI:", error)
    return NextResponse.json({ valid: false, details: "An unexpected error occurred" }, { status: 200 })
  }
}

