import { createServerClient } from "./supabase"

// Image functions
export async function saveImageToDB(image: {
  id: string
  url: string
  caption: string
  hashtags: string[]
  prompt?: string
  createdAt: string
  scheduled?: boolean
  scheduledTime?: string | null
  postedAt?: string | null
}) {
  const supabase = createServerClient()

  // Check if image with this ID already exists
  const { data: existingImage } = await supabase.from("images").select("id").eq("id", image.id).single()

  if (existingImage) {
    // Update existing image
    const { error } = await supabase
      .from("images")
      .update({
        url: image.url,
        caption: image.caption,
        hashtags: image.hashtags,
        prompt: image.prompt,
        scheduled: image.scheduled || false,
        scheduled_time: image.scheduledTime ? new Date(image.scheduledTime).toISOString() : null,
        posted_at: image.postedAt ? new Date(image.postedAt).toISOString() : null,
      })
      .eq("id", image.id)

    if (error) throw error

    return image
  } else {
    // Add new image
    const { error } = await supabase.from("images").insert({
      id: image.id,
      url: image.url,
      caption: image.caption,
      hashtags: image.hashtags,
      prompt: image.prompt,
      created_at: new Date(image.createdAt).toISOString(),
      scheduled: image.scheduled || false,
      scheduled_time: image.scheduledTime ? new Date(image.scheduledTime).toISOString() : null,
      posted_at: image.postedAt ? new Date(image.postedAt).toISOString() : null,
    })

    if (error) throw error

    return image
  }
}

export async function getImagesFromDB(id?: string) {
  const supabase = createServerClient()

  if (id) {
    const { data, error } = await supabase.from("images").select("*").eq("id", id).single()

    if (error) throw error

    return {
      id: data.id,
      url: data.url,
      caption: data.caption,
      hashtags: data.hashtags,
      prompt: data.prompt,
      createdAt: data.created_at,
      scheduled: data.scheduled,
      scheduledTime: data.scheduled_time,
      postedAt: data.posted_at,
    }
  }

  const { data, error } = await supabase.from("images").select("*").order("created_at", { ascending: false })

  if (error) throw error

  return data.map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption,
    hashtags: img.hashtags,
    prompt: img.prompt,
    createdAt: img.created_at,
    scheduled: img.scheduled,
    scheduledTime: img.scheduled_time,
    postedAt: img.posted_at,
  }))
}

// Update the getScheduledImagesFromDB function to add better error handling
export async function getScheduledImagesFromDB() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("scheduled", true)
      .is("posted_at", null)
      .order("scheduled_time", { ascending: true })

    if (error) {
      console.error("Database error when fetching scheduled images:", error)
      // Return empty array instead of throwing
      return []
    }

    // If data is null or undefined, return empty array
    if (!data) {
      console.warn("No data returned from scheduled images query")
      return []
    }

    return data.map((img) => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      hashtags: img.hashtags || [],
      prompt: img.prompt,
      createdAt: img.created_at,
      scheduled: img.scheduled,
      scheduledTime: img.scheduled_time,
      postedAt: img.posted_at,
    }))
  } catch (error) {
    console.error("Unexpected error in getScheduledImagesFromDB:", error)
    // Return empty array instead of throwing
    return []
  }
}

export async function updateImageInDB(id: string, data: any) {
  const supabase = createServerClient()

  const updateData: any = {}

  if (data.caption !== undefined) updateData.caption = data.caption
  if (data.hashtags !== undefined) updateData.hashtags = data.hashtags
  if (data.scheduled !== undefined) updateData.scheduled = data.scheduled
  if (data.scheduledTime !== undefined) updateData.scheduled_time = data.scheduledTime

  const { error } = await supabase.from("images").update(updateData).eq("id", id)

  if (error) throw error

  return { id, ...data }
}

export async function deleteImageFromDB(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("images").delete().eq("id", id)

  if (error) throw error

  return true
}

export async function markImageAsPosted(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from("images")
    .update({
      posted_at: new Date().toISOString(),
      scheduled: false,
    })
    .eq("id", id)

  if (error) throw error

  return true
}

// Schedule functions
export async function getScheduleFromDB() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("schedule_settings").select("*").eq("id", 1).single()

  if (error) throw error

  return {
    enabled: data.enabled,
    frequency: data.frequency,
    time: data.time,
    daysOfWeek: data.days_of_week,
    customDays: data.custom_days,
  }
}

export async function updateScheduleInDB(settings: {
  enabled: boolean
  frequency: "daily" | "weekly" | "custom"
  time: string
  daysOfWeek: number[]
  customDays: number
}) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from("schedule_settings")
    .update({
      enabled: settings.enabled,
      frequency: settings.frequency,
      time: settings.time,
      days_of_week: settings.daysOfWeek,
      custom_days: settings.customDays,
    })
    .eq("id", 1)

  if (error) throw error

  return settings
}

// Instagram functions
export async function getInstagramFromDB() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("instagram_settings").select("*").eq("id", 1).single()

  if (error) throw error

  return {
    connected: data.connected,
    accountName: data.account_name,
    accountId: data.account_id,
    accessToken: data.access_token,
    profilePicture: data.profile_picture,
  }
}

export async function updateInstagramInDB(settings: {
  connected: boolean
  accountName: string
  accountId: string
  accessToken?: string
  profilePicture?: string
}) {
  try {
    console.log("Updating Instagram settings in DB:", {
      connected: settings.connected,
      accountName: settings.accountName,
      accountId: settings.accountId,
      hasAccessToken: !!settings.accessToken,
      hasProfilePicture: !!settings.profilePicture,
    })

    const supabase = createServerClient()

    const updateData: any = {
      connected: settings.connected,
      account_name: settings.accountName,
      account_id: settings.accountId,
    }

    if (settings.accessToken !== undefined) updateData.access_token = settings.accessToken
    if (settings.profilePicture !== undefined) updateData.profile_picture = settings.profilePicture

    // First check if the record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("instagram_settings")
      .select("id")
      .eq("id", 1)
      .single()

    if (checkError) {
      // If the error is not found, we need to insert instead of update
      if (checkError.code === "PGRST116") {
        console.log("Instagram settings record not found, creating new record")
        const { error: insertError } = await supabase.from("instagram_settings").insert({
          id: 1,
          ...updateData,
        })

        if (insertError) {
          console.error("Error inserting Instagram settings:", insertError)
          throw insertError
        }
      } else {
        console.error("Error checking Instagram settings:", checkError)
        throw checkError
      }
    } else {
      // Record exists, update it
      const { error: updateError } = await supabase.from("instagram_settings").update(updateData).eq("id", 1)

      if (updateError) {
        console.error("Error updating Instagram settings:", updateError)
        throw updateError
      }
    }

    console.log("Instagram settings updated successfully")
    return settings
  } catch (error) {
    console.error("Error in updateInstagramInDB:", error)
    throw error
  }
}

// Saved prompts functions
export async function getSavedPromptsFromDB() {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("saved_prompts").select("*").order("created_at", { ascending: false })

  if (error) throw error

  return data.map((prompt) => ({
    id: prompt.id,
    name: prompt.name,
    prompt: prompt.prompt,
    createdAt: prompt.created_at,
  }))
}

export async function savePromptToDB(prompt: {
  id: string
  name: string
  prompt: string
  createdAt: string
}) {
  const supabase = createServerClient()

  // Check if prompt with this ID already exists
  const { data: existingPrompt } = await supabase.from("saved_prompts").select("id").eq("id", prompt.id).single()

  if (existingPrompt) {
    // Update existing prompt
    const { error } = await supabase
      .from("saved_prompts")
      .update({
        name: prompt.name,
        prompt: prompt.prompt,
      })
      .eq("id", prompt.id)

    if (error) throw error
  } else {
    // Add new prompt
    const { error } = await supabase.from("saved_prompts").insert({
      id: prompt.id,
      name: prompt.name,
      prompt: prompt.prompt,
      created_at: new Date(prompt.createdAt).toISOString(),
    })

    if (error) throw error
  }

  return prompt
}

export async function deletePromptFromDB(id: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("saved_prompts").delete().eq("id", id)

  if (error) throw error

  return true
}

