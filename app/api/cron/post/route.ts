import { NextResponse } from "next/server"
import { getScheduledImagesFromDB, getScheduleFromDB, markImageAsPosted, getInstagramFromDB } from "@/lib/db"
import { postToInstagram, validateToken } from "@/lib/instagram"
import { mockPostToInstagram } from "@/lib/instagram-mock"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check if automatic posting is enabled
    const scheduleSettings = await getScheduleFromDB()

    if (!scheduleSettings.enabled) {
      return NextResponse.json({
        success: true,
        message: "Automatic posting is disabled",
        posted: 0,
      })
    }

    // Get Instagram account info
    const instagramAccount = await getInstagramFromDB()

    if (!instagramAccount.connected) {
      return NextResponse.json({
        success: false,
        message: "Instagram account not connected",
        posted: 0,
      })
    }

    // Check if we should use mock mode
    const useMock = process.env.NODE_ENV === "development" || process.env.USE_MOCK_INSTAGRAM === "true"

    // If not using mock, validate the token
    if (!useMock) {
      // Validate the access token
      const isTokenValid = await validateToken(instagramAccount.accessToken)

      if (!isTokenValid) {
        return NextResponse.json({
          success: false,
          message: "Instagram access token is invalid or expired",
          posted: 0,
        })
      }
    }

    // Get scheduled images that are due to be posted
    const scheduledImages = await getScheduledImagesFromDB()
    const now = new Date()

    // Filter images that are due to be posted
    const dueImages = scheduledImages.filter((image) => {
      const scheduledTime = new Date(image.scheduledTime)
      return scheduledTime <= now
    })

    if (dueImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No images due for posting",
        posted: 0,
      })
    }

    // Post the first due image
    const imageToPost = dueImages[0]

    // Format caption with hashtags
    const caption = `${imageToPost.caption}\n\n${imageToPost.hashtags.join(" ")}`

    try {
      let postId

      if (useMock) {
        console.log("Using mock Instagram posting for scheduled post")
        const mockResult = await mockPostToInstagram(imageToPost.url, caption)

        if (!mockResult.success) {
          throw new Error(mockResult.error || "Mock posting failed")
        }

        postId = mockResult.postId
      } else {
        // Post to Instagram using the Graph API
        postId = await postToInstagram(
          instagramAccount.accessToken,
          instagramAccount.accountId,
          imageToPost.url,
          caption,
        )
      }

      // Mark the image as posted
      await markImageAsPosted(imageToPost.id)

      return NextResponse.json({
        success: true,
        message: useMock ? "Posted to Instagram successfully (mock)" : "Posted to Instagram successfully",
        posted: 1,
        imageId: imageToPost.id,
        postId: postId,
      })
    } catch (postError) {
      console.error("Error posting to Instagram:", postError)
      return NextResponse.json({
        success: false,
        message: `Failed to post to Instagram: ${postError.message}`,
        posted: 0,
      })
    }
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to run cron job" }, { status: 500 })
  }
}

