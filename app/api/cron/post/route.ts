// Add a comment at the top of the file
import { NextResponse } from "next/server"
import { getScheduledImagesFromDB, getScheduleFromDB, getInstagramFromDB } from "@/lib/db"
import { postImageToInstagram, markImageAsPosted, logPostingActivity } from "@/lib/posting-service"
import { logger } from "@/lib/logger"

// This cron job runs once per day on Hobby plans
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Add a secret key check for additional security
  const authHeader = request.headers.get("authorization")
  const expectedKey = process.env.CRON_SECRET_KEY

  // If CRON_SECRET_KEY is set, verify it (skip check if not set)
  if (expectedKey && (!authHeader || authHeader !== `Bearer ${expectedKey}`)) {
    logger.warn("Unauthorized cron job request - missing or invalid secret key")
    return NextResponse.json({ error: "Unauthorized", message: "Invalid or missing secret key" }, { status: 401 })
  }

  try {
    logger.info("Running Instagram posting cron job:", new Date().toISOString())

    // Check if automatic posting is enabled
    const scheduleSettings = await getScheduleFromDB()

    if (!scheduleSettings.enabled) {
      logger.info("Automatic posting is disabled")
      return NextResponse.json({
        success: true,
        message: "Automatic posting is disabled",
        posted: 0,
      })
    }

    // Get Instagram account info
    const instagramAccount = await getInstagramFromDB()

    if (!instagramAccount.connected) {
      logger.error("Instagram account not connected")
      return NextResponse.json({
        success: false,
        message: "Instagram account not connected",
        posted: 0,
      })
    }

    // Get scheduled images that are due to be posted
    const scheduledImages = await getScheduledImagesFromDB()
    const now = new Date()

    logger.info(`Found ${scheduledImages.length} scheduled images`)

    // Filter images that are due to be posted
    const dueImages = scheduledImages.filter((image) => {
      if (!image.scheduledTime) return false
      const scheduledTime = new Date(image.scheduledTime)
      return scheduledTime <= now
    })

    logger.info(`Found ${dueImages.length} images due for posting`)

    if (dueImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No images due for posting",
        posted: 0,
      })
    }

    // Sort by scheduled time (oldest first) to ensure we post in the correct order
    dueImages.sort((a, b) => {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    })

    // Track successful posts
    let successfulPosts = 0
    let failedPosts = 0
    let rateLimitedPosts = 0

    // Process each due image
    for (const imageToPost of dueImages) {
      logger.info(`Posting image ID: ${imageToPost.id}, scheduled for: ${imageToPost.scheduledTime}`)

      // Format caption with hashtags
      const caption =
        imageToPost.hashtags && imageToPost.hashtags.length > 0
          ? `${imageToPost.caption}\n\n${imageToPost.hashtags.join(" ")}`
          : imageToPost.caption

      try {
        // Post to Instagram
        const postResult = await postImageToInstagram(imageToPost.url, caption)

        if (!postResult.success) {
          // Check if rate limited
          if (postResult.rateLimited) {
            logger.warn(`Rate limit reached when posting image ${imageToPost.id}`)
            rateLimitedPosts++

            // Log the rate limit failure
            await logPostingActivity(imageToPost.id, false, undefined, postResult.error || "Rate limit reached", true)

            // Stop processing more images if rate limited
            logger.warn("Stopping cron job due to rate limiting")
            break
          }

          throw new Error(postResult.error || "Posting failed")
        }

        // Mark the image as posted
        await markImageAsPosted(imageToPost.id, postResult.postId)

        // Log the activity
        await logPostingActivity(imageToPost.id, true, postResult.postId)

        logger.info(`Successfully posted image ${imageToPost.id} to Instagram`)
        successfulPosts++

        // Add a small delay between posts to avoid rate limiting
        if (dueImages.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 10000)) // 10 seconds between posts
        }
      } catch (postError) {
        logger.error(`Error posting image ${imageToPost.id} to Instagram:`, postError)

        // Log the failure
        await logPostingActivity(
          imageToPost.id,
          false,
          undefined,
          postError instanceof Error ? postError.message : String(postError),
        )

        failedPosts++

        // Add a longer delay after an error
        await new Promise((resolve) => setTimeout(resolve, 15000)) // 15 seconds after an error
      }
    }

    return NextResponse.json({
      success: true,
      message: "Instagram posting job completed",
      posted: successfulPosts,
      failed: failedPosts,
      rateLimited: rateLimitedPosts,
      totalDue: dueImages.length,
    })
  } catch (error) {
    logger.error("Cron job error:", error)
    return NextResponse.json(
      {
        error: "Failed to run cron job",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

