"use server"

import { getScheduleFromDB, updateScheduleInDB, getScheduledImagesFromDB } from "@/lib/db"

export async function getScheduleSettings() {
  try {
    const settings = await getScheduleFromDB()
    return settings
  } catch (error) {
    console.error("Error fetching schedule settings:", error)
    throw new Error("Failed to fetch schedule settings")
  }
}

export async function updateScheduleSettings(settings: {
  enabled: boolean
  frequency: "daily" | "weekly" | "custom"
  time: string
  daysOfWeek: number[]
  customDays: number
}) {
  try {
    await updateScheduleInDB(settings)
    return { success: true }
  } catch (error) {
    console.error("Error updating schedule settings:", error)
    throw new Error("Failed to update schedule settings")
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

