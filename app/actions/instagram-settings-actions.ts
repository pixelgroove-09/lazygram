"use server"

import { revalidatePath } from "next/cache"
import {
  getInstagramSettings,
  updateInstagramCredentials,
  updateInstagramConnection,
} from "@/lib/data/instagram-settings"
import { logger } from "@/lib/logger"

/**
 * Get Instagram settings
 */
export async function getInstagramSettingsAction() {
  try {
    const settings = await getInstagramSettings()

    // Don't expose the actual secret
    if (settings?.app_secret) {
      return {
        ...settings,
        app_secret: "••••••••••••••••",
      }
    }

    return settings
  } catch (error) {
    logger.error("Error in getInstagramSettingsAction:", error)
    throw new Error(`Failed to get Instagram settings: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Save Instagram credentials
 */
export async function saveInstagramCredentialsAction(credentials: {
  appId: string
  appSecret: string
}) {
  try {
    // Validate inputs
    if (!credentials.appId || !credentials.appSecret) {
      throw new Error("App ID and App Secret are required")
    }

    // Update environment variables
    process.env.INSTAGRAM_APP_ID = credentials.appId
    process.env.INSTAGRAM_APP_SECRET = credentials.appSecret

    // Update in database
    await updateInstagramCredentials(credentials.appId, credentials.appSecret)

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    logger.error("Error in saveInstagramCredentialsAction:", error)
    throw new Error(`Failed to save Instagram credentials: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Disconnect Instagram account
 */
export async function disconnectInstagramAction() {
  try {
    await updateInstagramConnection(false)

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    logger.error("Error in disconnectInstagramAction:", error)
    throw new Error(
      `Failed to disconnect Instagram account: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Test Instagram connection
 */
export async function testInstagramConnectionAction() {
  try {
    const settings = await getInstagramSettings()

    // Check if credentials are configured
    if (!settings?.app_id || !settings?.app_secret) {
      return {
        success: false,
        message: "Instagram API credentials are not configured",
      }
    }

    // Check if connected to an account
    if (!settings.connected || !settings.access_token) {
      return {
        success: false,
        message: "No Instagram account is connected",
      }
    }

    // Validate the token
    try {
      const { validateToken } = await import("@/lib/instagram")
      const isValid = await validateToken(settings.access_token)

      if (!isValid) {
        return {
          success: false,
          message: "Instagram access token is invalid or expired",
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    // If we get here, the connection is valid
    return {
      success: true,
      message: "Successfully connected to Instagram API",
    }
  } catch (error) {
    logger.error("Error in testInstagramConnectionAction:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

