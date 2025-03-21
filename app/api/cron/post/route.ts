import { NextResponse } from "next/server"
import { getScheduledImagesFromDB, getScheduleFromDB, markImageAsPosted, getInstagramFromDB } from "@/lib/db"
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
    const caption = `${imageToPost.caption}

${imageToPost.hashtags.join(" ")}`

    // Use the mock function to simulate posting to Instagram
    const result = await mockPostToInstagram(imageToPost.url, caption)

    if (!result.success) {
      throw new Error(result.error || "Failed to post to Instagram")
    }

    // Mark the image as posted
    await markImageAsPosted(imageToPost.id)

    return NextResponse.json({
      success: true,
      message: "Posted to Instagram successfully",
      posted: 1,
      imageId: imageToPost.id,
      postId: result.postId,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to run cron job" }, { status: 500 })
  }
}

