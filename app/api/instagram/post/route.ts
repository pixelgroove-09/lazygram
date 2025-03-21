import { type NextRequest, NextResponse } from "next/server"
import { getImagesFromDB, markImageAsPosted, getInstagramFromDB } from "@/lib/db"
import { postToInstagram, validateToken } from "@/lib/instagram"
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

    // Check if we should use mock mode
    const useMock = process.env.NODE_ENV === "development" || process.env.USE_MOCK_INSTAGRAM === "true"

    if (useMock) {
      console.log("Using mock Instagram posting")

      // Format caption with hashtags
      const caption = `${image.caption}\n\n${image.hashtags.join(" ")}`

      // Use mock posting
      const mockResult = await mockPostToInstagram(image.url, caption)

      if (!mockResult.success) {
        return NextResponse.json(
          {
            error: "Failed to post to Instagram (mock)",
            details: mockResult.error,
          },
          { status: 500 },
        )
      }

      // Mark the image as posted
      await markImageAsPosted(imageId)

      return NextResponse.json({
        success: true,
        message: "Posted to Instagram successfully (mock)",
        postId: mockResult.postId,
      })
    }

    // Validate the access token
    const isTokenValid = await validateToken(instagramAccount.accessToken)

    if (!isTokenValid) {
      return NextResponse.json({ error: "Instagram access token is invalid or expired" }, { status: 401 })
    }

    // Format caption with hashtags
    const caption = `${image.caption}\n\n${image.hashtags.join(" ")}`

    try {
      // Post to Instagram using the Graph API
      const postId = await postToInstagram(instagramAccount.accessToken, instagramAccount.accountId, image.url, caption)

      // Mark the image as posted
      await markImageAsPosted(imageId)

      return NextResponse.json({
        success: true,
        message: "Posted to Instagram successfully",
        postId: postId,
      })
    } catch (postError) {
      console.error("Error posting to Instagram:", postError)
      return NextResponse.json(
        {
          error: "Failed to post to Instagram",
          details: postError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Instagram posting error:", error)
    return NextResponse.json({ error: "Failed to post to Instagram" }, { status: 500 })
  }
}

