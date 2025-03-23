import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { logger } from "../logger"

export interface InstagramSettings {
  id: string
  app_id: string | null
  app_secret: string | null
  connected: boolean
  account_name: string | null
  account_id: string | null
  access_token: string | null
  profile_picture: string | null
  created_at: string
  updated_at: string
}

export interface InstagramSettingsInput {
  app_id?: string
  app_secret?: string
  connected?: boolean
  account_name?: string
  account_id?: string
  access_token?: string
  profile_picture?: string
}

/**
 * Get Instagram settings
 */
export async function getInstagramSettings(): Promise<InstagramSettings | null> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("instagram_settings").select("*").single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found, return null
        return null
      }

      logger.error("Error fetching Instagram settings:", error)
      throw new Error(`Failed to fetch Instagram settings: ${error.message}`)
    }

    return data as InstagramSettings
  } catch (error) {
    logger.error("Error in getInstagramSettings:", error)
    throw error
  }
}

/**
 * Create Instagram settings
 */
export async function createInstagramSettings(settings: InstagramSettingsInput): Promise<InstagramSettings> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase
      .from("instagram_settings")
      .insert({
        app_id: settings.app_id || null,
        app_secret: settings.app_secret || null,
        connected: settings.connected || false,
        account_name: settings.account_name || null,
        account_id: settings.account_id || null,
        access_token: settings.access_token || null,
        profile_picture: settings.profile_picture || null,
      })
      .select()
      .single()

    if (error) {
      logger.error("Error creating Instagram settings:", error)
      throw new Error(`Failed to create Instagram settings: ${error.message}`)
    }

    return data as InstagramSettings
  } catch (error) {
    logger.error("Error in createInstagramSettings:", error)
    throw error
  }
}

/**
 * Update Instagram settings
 */
export async function updateInstagramSettings(
  id: string,
  settings: InstagramSettingsInput,
): Promise<InstagramSettings> {
  try {
    const supabase = createClient(cookies())

    const updateData = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("instagram_settings").update(updateData).eq("id", id).select().single()

    if (error) {
      logger.error("Error updating Instagram settings:", error)
      throw new Error(`Failed to update Instagram settings: ${error.message}`)
    }

    return data as InstagramSettings
  } catch (error) {
    logger.error("Error in updateInstagramSettings:", error)
    throw error
  }
}

/**
 * Delete Instagram settings
 */
export async function deleteInstagramSettings(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies())

    const { error } = await supabase.from("instagram_settings").delete().eq("id", id)

    if (error) {
      logger.error("Error deleting Instagram settings:", error)
      throw new Error(`Failed to delete Instagram settings: ${error.message}`)
    }
  } catch (error) {
    logger.error("Error in deleteInstagramSettings:", error)
    throw error
  }
}

/**
 * Get or create Instagram settings
 */
export async function getOrCreateInstagramSettings(): Promise<InstagramSettings> {
  try {
    const settings = await getInstagramSettings()

    if (settings) {
      return settings
    }

    // Create default settings
    return await createInstagramSettings({
      connected: false,
    })
  } catch (error) {
    logger.error("Error in getOrCreateInstagramSettings:", error)
    throw error
  }
}

/**
 * Update Instagram connection
 */
export async function updateInstagramConnection(
  connected: boolean,
  accountData?: {
    account_name: string
    account_id: string
    access_token: string
    profile_picture?: string
  },
): Promise<InstagramSettings> {
  try {
    const settings = await getOrCreateInstagramSettings()

    const updateData: InstagramSettingsInput = {
      connected,
    }

    if (accountData) {
      updateData.account_name = accountData.account_name
      updateData.account_id = accountData.account_id
      updateData.access_token = accountData.access_token

      if (accountData.profile_picture) {
        updateData.profile_picture = accountData.profile_picture
      }
    } else if (connected === false) {
      // If disconnecting, clear account data
      updateData.account_name = null
      updateData.account_id = null
      updateData.access_token = null
      updateData.profile_picture = null
    }

    return await updateInstagramSettings(settings.id, updateData)
  } catch (error) {
    logger.error("Error in updateInstagramConnection:", error)
    throw error
  }
}

/**
 * Update Instagram API credentials
 */
export async function updateInstagramCredentials(appId: string, appSecret: string): Promise<InstagramSettings> {
  try {
    const settings = await getOrCreateInstagramSettings()

    return await updateInstagramSettings(settings.id, {
      app_id: appId,
      app_secret: appSecret,
    })
  } catch (error) {
    logger.error("Error in updateInstagramCredentials:", error)
    throw error
  }
}

