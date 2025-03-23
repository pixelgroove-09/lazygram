import { type NextRequest, NextResponse } from "next/server"
import { uploadImageAction } from "@/app/actions/upload-actions"
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
        logger.warn("Unauthorized upload attempt")
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

    const formData = await request.formData()

    // Use the server action to upload the image
    const result = await uploadImageAction(formData)

    return NextResponse.json(result)
  } catch (error) {
    logger.error("Error uploading file:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

