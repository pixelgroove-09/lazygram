"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function bulkDeleteImages(imageIds: string[]) {
  try {
    if (!imageIds || imageIds.length === 0) {
      return { success: false, message: "No images selected" }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: "Authentication required" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient()

    // First, unschedule any scheduled images
    const { error: unscheduleError } = await supabase.from("scheduled_posts").delete().in("image_id", imageIds)

    if (unscheduleError) {
      logger.error("Error unscheduling images during bulk delete", unscheduleError)
      // Continue with deletion even if unscheduling fails
    }

    // Then delete the images
    const { error: deleteError } = await supabase.from("images").delete().in("id", imageIds)

    if (deleteError) {
      logger.error("Error deleting images in bulk", deleteError)
      return { success: false, message: `Failed to delete images: ${deleteError.message}` }
    }

    // Revalidate the paths
    revalidatePath("/upload")
    revalidatePath("/dashboard")
    revalidatePath("/schedule")

    return {
      success: true,
      message: `Successfully deleted ${imageIds.length} image${imageIds.length === 1 ? "" : "s"}`,
    }
  } catch (error: any) {
    logger.error("Unexpected error in bulkDeleteImages", error)
    return { success: false, message: `An unexpected error occurred: ${error.message}` }
  }
}

