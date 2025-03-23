import { type NextRequest, NextResponse } from "next/server"
import { schedulePostAction } from "@/app/actions/scheduled-posts-actions"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    // Check for admin API key if needed
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized Instagram schedule attempt")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Parse request body
    const body = await request.json()
    const { imageUrl, caption, scheduledTime } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Bad Request", message: "Image URL is required" }, { status: 400 })
    }

    if (!caption) {
      return NextResponse.json({ error: "Bad Request", message: "Caption is required" }, { status: 400 })
    }

    if (!scheduledTime) {
      return NextResponse.json({ error: "Bad Request", message: "Scheduled time is required" }, { status: 400 })
    }

    logger.info("Scheduling Instagram post", {
      imageUrl,
      captionLength: caption.length,
      scheduledTime,
    })

    // Schedule the post using the server action
    const result = await schedulePostAction({ imageUrl, caption, scheduledTime })

    return NextResponse.json({
      status: "SUCCESS",
      message: "Post scheduled successfully",
      id: result.id,
      scheduledTime: result.scheduledTime,
    })
  } catch (error) {
    logger.error("Error in Instagram schedule API:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

