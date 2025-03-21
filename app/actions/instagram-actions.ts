"use server"

import { getInstagramFromDB, updateInstagramInDB } from "@/lib/db"

export async function getInstagramSettings() {
  try {
    console.log("Getting Instagram settings from DB")
    const settings = await getInstagramFromDB()
    return settings
  } catch (error) {
    console.error("Error fetching Instagram settings:", error)
    throw new Error("Failed to fetch Instagram settings")
  }
}

export async function updateInstagramSettings(settings: {
  connected: boolean
  accountName: string
  accountId: string
  accessToken?: string
  profilePicture?: string
}) {
  try {
    console.log("Updating Instagram settings in DB")
    await updateInstagramInDB(settings)
    return { success: true }
  } catch (error) {
    console.error("Error updating Instagram settings:", error)
    throw new Error("Failed to update Instagram settings")
  }
}

export async function disconnectInstagram() {
  try {
    console.log("Disconnecting Instagram account")
    await updateInstagramInDB({
      connected: false,
      accountName: "",
      accountId: "",
      accessToken: "",
      profilePicture: "",
    })

    return { success: true }
  } catch (error) {
    console.error("Error disconnecting from Instagram:", error)
    throw new Error("Failed to disconnect from Instagram")
  }
}

