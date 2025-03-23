import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Calculate offset
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    // Fetch logs with pagination
    const {
      data: logs,
      error,
      count,
    } = await supabase
      .from("posting_logs")
      .select(
        `
        *,
        images!inner (
          url
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error("Error fetching posting logs:", error)
      return NextResponse.json({ error: "Failed to fetch posting logs" }, { status: 500 })
    }

    // Format logs to include image URL
    const formattedLogs = logs.map((log) => ({
      ...log,
      image_url: log.images?.url,
      images: undefined, // Remove the nested images object
    }))

    return NextResponse.json({
      logs: formattedLogs,
      hasMore: count ? offset + limit < count : false,
      total: count || 0,
    })
  } catch (error) {
    logger.error("Error in posting logs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

