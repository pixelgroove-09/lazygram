"use server"

import { createServerSupabaseClient, getUserId } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getInstagramSettings() {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("instagram_settings").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching Instagram settings:", error)
    return null
  }

  return data
}

export async function getInstagramAccount() {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("instagram_accounts").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching Instagram account:", error)
    return null
  }

  return data
}

export async function checkInstagramConnection() {
  try {
    const account = await getInstagramAccount()
    const settings = await getInstagramSettings()

    return {
      connected: !!account && !!settings?.connected,
      account,
      settings,
    }
  } catch (error) {
    console.error("Error checking Instagram connection:", error)
    return {
      connected: false,
      account: null,
      settings: null,
    }
  }
}

export async function disconnectInstagram() {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  try {
    // Update instagram_settings to mark as disconnected
    const { error: settingsError } = await supabase
      .from("instagram_settings")
      .update({
        connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (settingsError) {
      console.error("Error updating Instagram settings:", settingsError)
      throw new Error("Failed to disconnect Instagram account")
    }

    // Optionally, you could also delete the account record or invalidate the token
    // For now, we'll just mark it as disconnected in the settings

    revalidatePath("/settings")
    revalidatePath("/debug")

    return { success: true, message: "Instagram account disconnected successfully" }
  } catch (error) {
    console.error("Error disconnecting Instagram account:", error)
    throw new Error("Failed to disconnect Instagram account")
  }
}

export async function getScheduledPosts() {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_for", { ascending: true })

  if (error) {
    console.error("Error fetching scheduled posts:", error)
    throw new Error("Failed to fetch scheduled posts")
  }

  return data || []
}

export async function getPostHistory() {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("posts_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching post history:", error)
    throw new Error("Failed to fetch post history")
  }

  return data || []
}

// Add the missing saveInstagramCredentials function
export async function saveInstagramCredentials(credentials: { appId: string; appSecret: string }) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  try {
    // First, check if settings already exist
    const { data: existingSettings } = await supabase
      .from("instagram_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    // Prepare the data to save
    const settingsData = {
      user_id: userId,
      app_id: credentials.appId,
      app_secret: credentials.appSecret,
      updated_at: new Date().toISOString(),
    }

    let result

    if (existingSettings) {
      // Update existing settings
      result = await supabase.from("instagram_settings").update(settingsData).eq("user_id", userId)
    } else {
      // Create new settings
      result = await supabase.from("instagram_settings").insert({
        ...settingsData,
        connected: false,
        created_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error saving Instagram credentials:", result.error)
      throw new Error("Failed to save Instagram credentials")
    }

    // Also update environment variables if possible
    // Note: This would typically be handled differently in a production environment
    // as server-side code can't modify environment variables at runtime

    revalidatePath("/settings")
    revalidatePath("/debug")

    return { success: true, message: "Instagram credentials saved successfully" }
  } catch (error) {
    console.error("Error saving Instagram credentials:", error)
    throw new Error("Failed to save Instagram credentials")
  }
}

// Add the missing testInstagramConnection function
export async function testInstagramConnection() {
  try {
    // Get the user ID
    const userId = await getUserId()

    if (!userId) {
      return {
        success: false,
        message: "User not authenticated",
        details: "You must be logged in to test the Instagram connection.",
      }
    }

    // Get the Instagram settings
    const settings = await getInstagramSettings()

    if (!settings) {
      return {
        success: false,
        message: "Instagram settings not found",
        details: "Please configure your Instagram API credentials first.",
      }
    }

    // Get the Instagram account
    const account = await getInstagramAccount()

    // Check if we're in mock mode
    const useMock = process.env.USE_MOCK_INSTAGRAM === "true"

    if (useMock) {
      // In mock mode, we'll simulate a successful connection
      return {
        success: true,
        message: "Connection successful (MOCK MODE)",
        details: "Mock mode is enabled. This is a simulated successful connection.",
      }
    }

    // If we have an account with a valid token, test the connection
    if (account && account.access_token) {
      // Check if the token is expired
      if (account.token_expires_at) {
        const expiresAt = new Date(account.token_expires_at)
        const now = new Date()

        if (expiresAt < now) {
          return {
            success: false,
            message: "Access token expired",
            details: `Your Instagram access token expired on ${expiresAt.toLocaleString()}. Please reconnect your account.`,
          }
        }
      }

      try {
        // Make a test API call to Instagram
        // This would typically be a call to get the user's profile or a simple endpoint
        const response = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${account.access_token}`,
        )

        if (!response.ok) {
          const errorData = await response.json()
          return {
            success: false,
            message: "API call failed",
            details: `Error: ${errorData.error?.message || "Unknown error"}`,
          }
        }

        const data = await response.json()

        return {
          success: true,
          message: "Connection successful",
          details: `Connected to Instagram account: ${data.username} (ID: ${data.id})`,
        }
      } catch (error) {
        return {
          success: false,
          message: "API call failed",
          details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    } else {
      // No account or token
      return {
        success: false,
        message: "Not connected to Instagram",
        details: "You need to connect your Instagram account first.",
      }
    }
  } catch (error) {
    console.error("Error testing Instagram connection:", error)
    return {
      success: false,
      message: "Error testing connection",
      details: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Add more Instagram-related actions as needed
export async function updateInstagramSettings(settings: any) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  try {
    const { error } = await supabase.from("instagram_settings").upsert({
      ...settings,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error updating Instagram settings:", error)
      throw new Error("Failed to update Instagram settings")
    }

    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Error updating Instagram settings:", error)
    throw new Error("Failed to update Instagram settings")
  }
}

export async function reconnectInstagram() {
  // This function would typically redirect to the Instagram auth flow
  // For now, we'll just return a success message
  return { success: true, message: "Please use the Connect Instagram button to reconnect your account" }
}

