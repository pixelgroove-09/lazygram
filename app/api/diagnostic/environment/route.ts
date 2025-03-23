import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check required environment variables
    const requiredVariables = [
      "INSTAGRAM_APP_ID",
      "INSTAGRAM_APP_SECRET",
      "NEXT_PUBLIC_APP_URL",
      "BLOB_READ_WRITE_TOKEN",
      "CLAUDE_API_KEY",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]

    const variables: Record<string, boolean> = {}
    let allVariablesSet = true

    for (const variable of requiredVariables) {
      const isSet = !!process.env[variable]
      variables[variable] = isSet
      if (!isSet) allVariablesSet = false
    }

    // Check mock mode
    const mockMode = process.env.USE_MOCK_INSTAGRAM === "true"

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      allVariablesSet,
      variables,
      mockMode,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Environment diagnostic error:", error)
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

