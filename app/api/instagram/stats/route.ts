import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    // Check for admin API key if needed
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized stats request")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    const supabase = createClient(cookies())

    // Get all posts
    const { data: allPosts, error: postsError } = await supabase.from("scheduled_posts").select("*")

    if (postsError) {
      logger.error("Error fetching posts for stats:", postsError)
      return NextResponse.json({ error: "Database Error", message: "Failed to fetch posts" }, { status: 500 })
    }

    // Get scheduled posts
    const { data: scheduledPosts, error: scheduledError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")

    if (scheduledError) {
      logger.error("Error fetching scheduled posts for stats:", scheduledError)
      return NextResponse.json({ error: "Database Error", message: "Failed to fetch scheduled posts" }, { status: 500 })
    }

    // Get posted posts
    const { data: postedPosts, error: postedError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "posted")

    if (postedError) {
      logger.error("Error fetching posted posts for stats:", postedError)
      return NextResponse.json({ error: "Database Error", message: "Failed to fetch posted posts" }, { status: 500 })
    }

    // Get failed posts
    const { data: failedPosts, error: failedError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "failed")

    if (failedError) {
      logger.error("Error fetching failed posts for stats:", failedError)
      return NextResponse.json({ error: "Database Error", message: "Failed to fetch failed posts" }, { status: 500 })
    }

    // Generate posts by day data (last 7 days)
    const postsByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const day = format(date, "EEE")
      const dateString = format(date, "yyyy-MM-dd")

      // Count posts on this day
      const count = allPosts.filter((post) => {
        const postDate = new Date(post.created_at || post.scheduled_time)
        return format(postDate, "yyyy-MM-dd") === dateString
      }).length

      postsByDay.push({ day, count })
    }

    // Generate posts by status data
    const postsByStatus = [
      { name: "Scheduled", value: scheduledPosts.length },
      { name: "Posted", value: postedPosts.length },
      { name: "Failed", value: failedPosts.length },
    ]

    return NextResponse.json({
      totalPosts: allPosts.length,
      scheduledPosts: scheduledPosts.length,
      postedCount: postedPosts.length,
      failedCount: failedPosts.length,
      postsByDay,
      postsByStatus,
    })
  } catch (error) {
    logger.error("Error in Instagram stats API:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

