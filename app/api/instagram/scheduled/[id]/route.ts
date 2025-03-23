import { type NextRequest, NextResponse } from "next/server"
import { deleteScheduledPostAction } from "@/app/actions/scheduled-posts-actions"
import { logger } from "@/lib/logger"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check for admin API key if needed
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized scheduled post delete attempt")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Delete the scheduled post using the server action
    const result = await deleteScheduledPostAction(id)

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error in delete scheduled post API:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

