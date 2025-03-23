import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if mock mode is enabled via environment variable
    const mockModeEnabled = process.env.USE_MOCK_INSTAGRAM === "true"

    return NextResponse.json({ mockModeEnabled })
  } catch (error) {
    console.error("Error getting mock mode status:", error)
    return NextResponse.json({ message: "Failed to get mock mode status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, adminKey } = await request.json()

    // Check if admin key is provided and valid
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { message: "Unauthorized. Admin API key required to change mock mode." },
        { status: 403 },
      )
    }

    // In a real implementation, this would update an environment variable
    // or a database setting. For now, we'll just return the requested state
    // since we can't modify environment variables at runtime.

    return NextResponse.json({
      mockModeEnabled: enabled,
      message:
        "Mock mode settings can only be changed by updating the USE_MOCK_INSTAGRAM environment variable. This is a simulated response.",
    })
  } catch (error) {
    console.error("Error setting mock mode:", error)
    return NextResponse.json({ message: "Failed to set mock mode" }, { status: 500 })
  }
}

