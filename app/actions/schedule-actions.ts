"use server"

import { revalidatePath } from "next/cache"
import { getScheduleFromDB, updateScheduleInDB } from "@/lib/db"
import { scheduleImage, unscheduleImage } from "./image-actions"

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
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating schedule settings:", error)
    throw new Error("Failed to update schedule settings")
  }
}

// Update the scheduled time for an image
export async function updateScheduledTime(imageId: string, newTime: string) {
  try {
    await scheduleImage(imageId, newTime)
    revalidatePath("/schedule")
    return { success: true }
  } catch (error) {
    console.error("Error updating scheduled time:", error)
    throw new Error("Failed to update scheduled time")
  }
}

// Move an image from unscheduled to scheduled
export async function scheduleUnscheduledImage(imageId: string, scheduledTime: string) {
  try {
    await scheduleImage(imageId, scheduledTime)
    revalidatePath("/schedule")
    return { success: true }
  } catch (error) {
    console.error("Error scheduling image:", error)
    throw new Error("Failed to schedule image")
  }
}

// Remove an image from the schedule
export async function removeFromSchedule(imageId: string) {
  try {
    await unscheduleImage(imageId)
    revalidatePath("/schedule")
    return { success: true }
  } catch (error) {
    console.error("Error removing from schedule:", error)
    throw new Error("Failed to remove from schedule")
  }
}

