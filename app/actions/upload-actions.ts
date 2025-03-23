"use server"

import { uploadImage, uploadFile } from "@/lib/blob-storage"
import { logger } from "@/lib/logger"

/**
 * Upload an image
 */
export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    const result = await uploadImage(file, "instagram")

    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    logger.error("Error in uploadImageAction:", error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Upload a file
 */
export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      throw new Error("No file provided")
    }

    const result = await uploadFile(file, folder)

    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    logger.error("Error in uploadFileAction:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

