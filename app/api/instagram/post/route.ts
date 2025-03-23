import { type NextRequest, NextResponse } from "next/server"
import { postNowAction } from "@/app/actions/scheduled-posts-actions"
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
        logger.warn("Unauthorized Instagram post attempt")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Parse request body
    const body = await request.json()
    const { imageUrl, caption } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Bad Request", message: "Image URL is required" }, { status: 400 })
    }

    if (!caption) {
      return NextResponse.json({ error: "Bad Request", message: "Caption is required" }, { status: 400 })
    }

    logger.info("Posting to Instagram", { imageUrl, captionLength: caption.length })

    // Post to Instagram using the server action
    const result = await postNowAction({ imageUrl, caption })

    if (!result.success) {
      logger.error("Instagram post failed", { error: result.message })
      return NextResponse.json({ error: "Instagram API Error", message: result.message }, { status: 500 })
    }

    logger.info("Instagram post successful", { postId: result.id })

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error in Instagram post API:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

