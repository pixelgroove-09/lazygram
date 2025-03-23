import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    logger.info("Instagram webhook verification request received", { mode, token })

    // Check if this is a verification request
    if (mode === "subscribe") {
      // Verify that the token matches your verification token
      const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN

      if (!verifyToken) {
        logger.error("INSTAGRAM_WEBHOOK_VERIFY_TOKEN environment variable is not set")
        return new NextResponse("Verification token not configured", { status: 500 })
      }

      if (token === verifyToken) {
        logger.info("Webhook verified successfully")
        // Respond with the challenge to confirm verification
        return new NextResponse(challenge)
      } else {
        logger.error("Webhook verification failed - token mismatch", {
          expected: verifyToken,
          received: token,
        })
        return new NextResponse("Verification failed", { status: 403 })
      }
    }

    return new NextResponse("Invalid request", { status: 400 })
  } catch (error) {
    logger.error("Error in webhook verification:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const body = await request.json()

    logger.info("Instagram webhook notification received", { body })

    // Process the webhook notification
    // This is where you would handle different types of webhook events

    // Return a 200 OK response to acknowledge receipt
    return new NextResponse("OK")
  } catch (error) {
    logger.error("Error processing webhook notification:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

