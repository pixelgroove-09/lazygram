import { put, del, list, type PutBlobResult } from "@vercel/blob"
import { logger } from "./logger"

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(file: File, folder = "uploads"): Promise<PutBlobResult> {
  try {
    logger.info(`Uploading file: ${file.name} (${file.size} bytes) to ${folder}`)

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `${folder}/${timestamp}-${randomString}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    logger.info(`File uploaded: ${blob.url}`)
    return blob
  } catch (error) {
    logger.error("Error uploading file:", error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Upload an image to Vercel Blob storage
 */
export async function uploadImage(file: File, folder = "images"): Promise<PutBlobResult> {
  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/jpg"]
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG and PNG are supported.")
  }

  // Validate file size (8MB max)
  const maxSize = 8 * 1024 * 1024 // 8MB
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 8MB.")
  }

  return uploadFile(file, folder)
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    logger.info(`Deleting file: ${url}`)
    await del(url)
    logger.info(`File deleted: ${url}`)
  } catch (error) {
    logger.error("Error deleting file:", error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * List files in Vercel Blob storage
 */
export async function listFiles(prefix = ""): Promise<{ blobs: { url: string; pathname: string }[] }> {
  try {
    logger.info(`Listing files with prefix: ${prefix}`)
    const result = await list({ prefix })
    logger.info(`Found ${result.blobs.length} files`)
    return result
  } catch (error) {
    logger.error("Error listing files:", error)
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Upload a file from a URL to Vercel Blob storage
 */
export async function uploadFromUrl(url: string, folder = "uploads"): Promise<PutBlobResult> {
  try {
    logger.info(`Uploading file from URL: ${url}`)

    // Fetch the file
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    // Get the file as a blob
    const blob = await response.blob()

    // Extract filename from URL or generate one
    let filename = url.split("/").pop() || "file"
    if (filename.includes("?")) {
      filename = filename.split("?")[0]
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const uniqueFilename = `${folder}/${timestamp}-${randomString}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const file = new File([blob], filename, { type: blob.type })
    const result = await put(uniqueFilename, file, {
      access: "public",
    })

    logger.info(`File uploaded from URL: ${result.url}`)
    return result
  } catch (error) {
    logger.error("Error uploading file from URL:", error)
    throw new Error(`Failed to upload file from URL: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

