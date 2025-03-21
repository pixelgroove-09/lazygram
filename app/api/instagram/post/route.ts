import { type NextRequest, NextResponse } from "next/server"
import { getImagesFromDB, markImageAsPosted, getInstagramFromDB } from "@/lib/db"
import { mockPostToInstagram } from "@/lib/instagram-mock"

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: "No image ID provided" }, { status: 400 })
    }

    // Get the image data
    const image = await getImagesFromDB(imageId)

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Get Instagram account info
    const instagramAccount = await getInstagramFromDB()

    if (!instagramAccount.connected) {
      return NextResponse.json({ error: "Instagram account not connected" }, { status: 400 })
    }

    // Format caption with hashtags
    const caption = `${image.caption}

${image.hashtags.join(" ")}`

    // Use the mock function to simulate posting to Instagram
    const result = await mockPostToInstagram(image.url, caption)

    if (!result.success) {
      throw new Error(result.error || "Failed to post to Instagram")
    }

    // Mark the image as posted
    await markImageAsPosted(imageId)

    return NextResponse.json({
      success: true,
      message: "Posted to Instagram successfully",
      postId: result.postId,
    })
  } catch (error) {
    console.error("Instagram posting error:", error)
    return NextResponse.json({ error: "Failed to post to Instagram" }, { status: 500 })
  }
}

