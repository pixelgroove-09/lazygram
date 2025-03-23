import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if mock mode is enabled
    const mockMode = process.env.USE_MOCK_INSTAGRAM === "true"

    return NextResponse.json({
      mockMode,
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Error checking mock mode:", error)
    return NextResponse.json(
      {
        error: "Failed to check mock mode",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

