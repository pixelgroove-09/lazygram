import { type NextRequest, NextResponse } from "next/server"
import { list, del } from "@vercel/blob"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    // Check for admin API key if needed
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized files request")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.error("BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json(
        { error: "Configuration Error", message: "Storage is not properly configured" },
        { status: 500 },
      )
    }

    // Get prefix from query params
    const prefix = request.nextUrl.searchParams.get("prefix") || ""

    // List files
    const result = await list({ prefix })

    return NextResponse.json({
      files: result.blobs,
    })
  } catch (error) {
    logger.error("Error listing files:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for admin API key if needed
    const apiKey = request.headers.get("x-api-key")
    if (process.env.ADMIN_API_KEY && apiKey !== process.env.ADMIN_API_KEY) {
      // Skip API key check for internal requests
      const referer = request.headers.get("referer") || ""
      const isInternalRequest = referer.includes(process.env.NEXT_PUBLIC_APP_URL || "")

      if (!isInternalRequest) {
        logger.warn("Unauthorized file delete attempt")
        return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 })
      }
    }

    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.error("BLOB_READ_WRITE_TOKEN is not set")
      return NextResponse.json(
        { error: "Configuration Error", message: "Storage is not properly configured" },
        { status: 500 },
      )
    }

    // Get URL from query params
    const url = request.nextUrl.searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "Bad Request", message: "URL parameter is required" }, { status: 400 })
    }

    // Delete file
    await del(url)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    logger.error("Error deleting file:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

