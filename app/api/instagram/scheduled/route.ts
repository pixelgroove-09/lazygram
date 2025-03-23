import { NextResponse } from "next/server"
import { createServerSupabaseClient, getUserId } from "@/lib/supabase/server"

export async function GET() {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_for", { ascending: true })

    if (error) {
      console.error("Error fetching scheduled posts:", error)
      return NextResponse.json({ error: "Failed to fetch scheduled posts" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

