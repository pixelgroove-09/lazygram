import { NextResponse } from "next/server"

export async function GET() {
  try {
    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET

    const valid = !!appId && !!appSecret

    let details = ""
    if (!appId) {
      details += "INSTAGRAM_APP_ID is missing. "
    }
    if (!appSecret) {
      details += "INSTAGRAM_APP_SECRET is missing. "
    }
    if (valid) {
      details = "API credentials are properly configured."
    }

    return NextResponse.json({ valid, details })
  } catch (error) {
    console.error("Error checking credentials:", error)
    return NextResponse.json({ valid: false, details: "An unexpected error occurred" }, { status: 200 })
  }
}

