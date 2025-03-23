import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Get all Instagram request logs
export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // Fetch logs from the database
    const { data, error } = await supabase
      .from("instagram_request_logs")
      .select("*")
      .order("timestamp", { ascending: false })

    if (error) {
      logger.error("Error fetching Instagram request logs:", error)
      return NextResponse.json({ error: "Failed to fetch Instagram request logs" }, { status: 500 })
    }

    return NextResponse.json({ logs: data })
  } catch (error) {
    logger.error("Error in Instagram logs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Create a new Instagram request log
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.url || !body.method || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Insert log into the database
    const { data, error } = await supabase
      .from("instagram_request_logs")
      .insert({
        type: body.type,
        url: body.url,
        method: body.method,
        headers: body.headers || {},
        body: body.body,
        response: body.response,
        error: body.error,
        timestamp: new Date().toISOString(),
      })
      .select()

    if (error) {
      logger.error("Error creating Instagram request log:", error)
      return NextResponse.json({ error: "Failed to create Instagram request log" }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data[0] })
  } catch (error) {
    logger.error("Error in Instagram logs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Clear all Instagram request logs
export async function DELETE(request: Request) {
  try {
    const supabase = createServerClient()

    // Delete all logs from the database
    const { error } = await supabase.from("instagram_request_logs").delete().neq("id", 0) // This is a workaround to delete all records

    if (error) {
      logger.error("Error clearing Instagram request logs:", error)
      return NextResponse.json({ error: "Failed to clear Instagram request logs" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error in Instagram logs API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

