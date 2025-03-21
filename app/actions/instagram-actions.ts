"use server"

import { getInstagramFromDB, updateInstagramInDB } from "@/lib/db"
import { validateToken } from "@/lib/instagram"

export async function getInstagramSettings() {
  try {
    console.log("Getting Instagram settings from DB")
    const settings = await getInstagramFromDB()

    // If connected, validate the token
    if (settings.connected && settings.accessToken) {
      const isTokenValid = await validateToken(settings.accessToken)

      // If token is invalid, update the settings
      if (!isTokenValid) {
        console.warn("Instagram token is invalid, marking as disconnected")
        settings.connected = false
      }
    }

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

