import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredVars = [
      "INSTAGRAM_APP_ID",
      "INSTAGRAM_APP_SECRET",
      "NEXT_PUBLIC_APP_URL",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
    ]

    const missingVars = requiredVars.filter((varName) => !process.env[varName])

    const valid = missingVars.length === 0

    let details = ""
    if (!valid) {
      details = `Missing environment variables: ${missingVars.join(", ")}`
    } else {
      details = "All required environment variables are properly set."
    }

    return NextResponse.json({ valid, details })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ valid: false, details: "An unexpected error occurred" }, { status: 200 })
  }
}

