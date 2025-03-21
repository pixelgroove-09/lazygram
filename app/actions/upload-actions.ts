"use server"

import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { analyzeImageWithClaude } from "@/lib/claude"
import { saveImageToDB } from "@/lib/db"

export async function uploadImages(formData: FormData) {
  try {
    const images = formData.getAll("images") as File[]
    const prompt = formData.get("prompt") as string

    if (!images || images.length === 0) {
      throw new Error("No images provided")
    }

    if (!prompt) {
      throw new Error("No prompt provided")
    }

    const uploadPromises = images.map(async (image) => {
      // Generate a unique ID for the image
      const id = uuidv4()

      // Create a unique filename to avoid collisions
      const filename = `${id}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

      // Upload the image to Vercel Blob
      const blob = await put(filename, image, {
        access: "public",
      })

      // Analyze the image with Claude API to generate caption and hashtags
      const analysis = await analyzeImageWithClaude(blob.url, prompt)

      // Save the image data to the database
      await saveImageToDB({
        id,
        url: blob.url,
        caption: analysis.caption,
        hashtags: analysis.hashtags,
        createdAt: new Date().toISOString(),
      })

      return {
        id,
        url: blob.url,
        caption: analysis.caption,
        hashtags: analysis.hashtags,
      }
    })

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)

    // Revalidate the images page to show the new uploads
    revalidatePath("/")

    return results
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}

