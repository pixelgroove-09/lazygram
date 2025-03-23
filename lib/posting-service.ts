import { createInstagramClient } from "./instagram-api"
import { createServerClient } from "./supabase"
import { logger } from "./logger"

interface PostingResult {
  success: boolean
  postId?: string
  error?: string
  details?: any
  rateLimited?: boolean
}

/**
 * Post an image to Instagram
 */
export async function postImageToInstagram(imageUrl: string, caption: string): Promise<PostingResult> {
  try {
    logger.info("Posting to Instagram")

    // Validate inputs
    if (!imageUrl) {
      logger.warn("Image URL is required")
      return {
        success: false,
        error: "Image URL is required",
      }
    }

    if (!caption) {
      logger.warn("Caption is required")
      return {
        success: false,
        error: "Caption is required",
      }
    }

    // Create Instagram client
    logger.info("Creating Instagram client")
    const client = await createInstagramClient()
    if (!client) {
      logger.error("Failed to create Instagram client - no credentials or not connected")
      return {
        success: false,
        error: "Instagram account not connected or credentials missing",
      }
    }

    // Validate token before posting
    logger.info("Validating Instagram access token")
    const isTokenValid = await client.validateToken()
    if (!isTokenValid) {
      logger.error("Instagram access token is invalid or expired")
      return {
        success: false,
        error: "Instagram access token is invalid or expired",
      }
    }

    // Post the image
    logger.info("Posting image to Instagram")
    try {
      const result = await client.postImage(imageUrl, caption)

      if (!result.success) {
        logger.error("Instagram posting failed:", result.error)

        // Check if rate limited
        if (result.rateLimited) {
          logger.warn("Instagram rate limit reached. Try again later.")
          return {
            success: false,
            error: "Instagram rate limit reached. Please try again later.",
            rateLimited: true,
            details: result.details,
          }
        }
      } else {
        logger.info("Instagram posting succeeded with ID:", result.postId)
      }

      return result
    } catch (postError) {
      logger.error("Error in client.postImage:", postError)
      return {
        success: false,
        error: postError instanceof Error ? postError.message : "Error during Instagram posting",
        details: postError,
      }
    }
  } catch (error) {
    logger.error("Error posting to Instagram:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during Instagram posting",
      details: error,
    }
  }
}

/**
 * Mark an image as posted in the database
 */
export async function markImageAsPosted(imageId: string, postId?: string): Promise<boolean> {
  try {
    if (!imageId) {
      logger.warn("No image ID provided for marking as posted")
      return false
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from("images")
      .update({
        posted_at: new Date().toISOString(),
        scheduled: false,
        instagram_post_id: postId || null,
      })
      .eq("id", imageId)

    if (error) {
      logger.error(`Error marking image ${imageId} as posted:`, error)
      return false
    }

    logger.info(`Marked image ${imageId} as posted`)
    return true
  } catch (error) {
    logger.error(`Error marking image ${imageId} as posted:`, error)
    return false
  }
}

/**
 * Log posting activity
 */
export async function logPostingActivity(
  imageId: string,
  success: boolean,
  postId?: string,
  error?: string,
  rateLimited?: boolean,
): Promise<void> {
  try {
    logger.info(`Logging posting activity for image ${imageId}:`, { success, postId, error, rateLimited })
    const supabase = createServerClient()

    const { error: dbError } = await supabase.from("posting_logs").insert({
      image_id: imageId,
      success,
      instagram_post_id: postId || null,
      error_message: error || null,
      rate_limited: rateLimited || false,
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      logger.error(`Error logging posting activity:`, dbError)
      return
    }

    logger.info(`Successfully logged posting activity for image ${imageId}`)
  } catch (error) {
    logger.error(`Error logging posting activity for image ${imageId}:`, error)
  }
}

/**
 * Get posting statistics
 */
export async function getPostingStats(): Promise<{
  totalPosts: number
  successfulPosts: number
  failedPosts: number
  rateLimitedPosts: number
}> {
  try {
    logger.info("Getting posting statistics")
    const supabase = createServerClient()

    // Get total posts
    const { count: totalPosts, error: totalError } = await supabase.from("posting_logs").count()

    if (totalError) {
      logger.error("Error getting total posts:", totalError)
      throw totalError
    }

    // Get successful posts
    const { count: successfulPosts, error: successError } = await supabase
      .from("posting_logs")
      .count()
      .eq("success", true)

    if (successError) {
      logger.error("Error getting successful posts:", successError)
      throw successError
    }

    // Get failed posts
    const { count: failedPosts, error: failedError } = await supabase.from("posting_logs").count().eq("success", false)

    if (failedError) {
      logger.error("Error getting failed posts:", failedError)
      throw failedError
    }

    // Get rate limited posts
    const { count: rateLimitedPosts, error: rateLimitedError } = await supabase
      .from("posting_logs")
      .count()
      .eq("rate_limited", true)

    if (rateLimitedError) {
      logger.error("Error getting rate limited posts:", rateLimitedError)
      throw rateLimitedError
    }

    return {
      totalPosts: totalPosts || 0,
      successfulPosts: successfulPosts || 0,
      failedPosts: failedPosts || 0,
      rateLimitedPosts: rateLimitedPosts || 0,
    }
  } catch (error) {
    logger.error("Error getting posting stats:", error)
    return {
      totalPosts: 0,
      successfulPosts: 0,
      failedPosts: 0,
      rateLimitedPosts: 0,
    }
  }
}

