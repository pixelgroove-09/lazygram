"use server"

import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"
import { analyzeImageWithClaude } from "@/lib/claude"
import { saveImageToDB, getImagesFromDB, updateImageInDB, deleteImageFromDB, getScheduledImagesFromDB } from "@/lib/db"

export async function getImages() {
  try {
    const images = await getImagesFromDB()
    return images
  } catch (error) {
    console.error("Error fetching images:", error)
    throw new Error("Failed to fetch images")
  }
}

export async function analyzeAndSaveImage({ id, url, prompt }: { id: string; url: string; prompt: string }) {
  try {
    // Analyze the image with Claude API
    const analysis = await analyzeImageWithClaude(url, prompt)

    // Save the image data to the database
    await saveImageToDB({
      id,
      url,
      caption: analysis.caption,
      hashtags: analysis.hashtags,
      prompt,
      createdAt: new Date().toISOString(),
      scheduled: false,
      postedAt: null,
    })

    revalidatePath("/")
    return { success: true, id, url, caption: analysis.caption, hashtags: analysis.hashtags }
  } catch (error) {
    console.error("Error analyzing and saving image:", error)
    throw new Error("Failed to analyze and save image")
  }
}

export async function updateCaption(id: string, caption: string, hashtags: string[]) {
  try {
    await updateImageInDB(id, { caption, hashtags })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating caption:", error)
    throw new Error("Failed to update caption")
  }
}

export async function deleteImage(id: string) {
  try {
    // Get the image URL from the database
    const image = await getImagesFromDB(id)

    if (!image) {
      throw new Error("Image not found")
    }

    // Extract the pathname from the URL
    const url = new URL(image.url)
    const pathname = url.pathname.split("/").pop()

    if (pathname) {
      // Delete from Vercel Blob
      await del(pathname)
    }

    // Delete from database
    await deleteImageFromDB(id)

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    throw new Error("Failed to delete image")
  }
}

export async function scheduleImage(id: string, scheduledTime: string) {
  try {
    await updateImageInDB(id, {
      scheduled: true,
      scheduledTime,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error scheduling image:", error)
    throw new Error("Failed to schedule image")
  }
}

export async function unscheduleImage(id: string) {
  try {
    await updateImageInDB(id, {
      scheduled: false,
      scheduledTime: null,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error unscheduling image:", error)
    throw new Error("Failed to unschedule image")
  }
}

export async function getScheduledImages() {
  try {
    const images = await getScheduledImagesFromDB()
    return images
  } catch (error) {
    console.error("Error fetching scheduled images:", error)
    throw new Error("Failed to fetch scheduled images")
  }
}

