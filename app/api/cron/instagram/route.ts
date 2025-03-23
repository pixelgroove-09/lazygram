import { type NextRequest, NextResponse } from "next/server"
import { processDuePostsAction } from "@/app/actions/scheduled-posts-actions"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn("Unauthorized cron job attempt")
      return NextResponse.json({ error: "Unauthorized", message: "Invalid authorization" }, { status: 401 })
    }

    logger.info("Running Instagram scheduled posts cron job")

    // Process due posts using the server action
    const result = await processDuePostsAction()

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error in Instagram scheduled posts cron job:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

