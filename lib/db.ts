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
  userId: string // Add userId
}) {
  const supabase = createServerClient()

  // Check if image with this ID already exists
  const { data: existingImage } = await supabase
    .from("images")
    .select("id")
    .eq("id", image.id)
    .eq("user_id", image.userId) // Filter by user
    .single()

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
      .eq("user_id", image.userId) // Filter by user

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
      user_id: image.userId, // Add user_id
    })

    if (error) throw error

    return image
  }
}

export async function getImagesFromDB(userId: string, id?: string) {
  const supabase = createServerClient()

  if (id) {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId) // Filter by user
      .single()

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
      userId: data.user_id,
    }
  }

  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("user_id", userId) // Filter by user
    .order("created_at", { ascending: false })

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
    userId: img.user_id,
  }))
}

export async function getScheduledImagesFromDB(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("scheduled", true)
    .eq("user_id", userId) // Filter by user
    .is("posted_at", null)
    .order("scheduled_time", { ascending: true })

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
    userId: img.user_id,
  }))
}

export async function updateImageInDB(id: string, userId: string, data: any) {
  const supabase = createServerClient()

  const updateData: any = {}

  if (data.caption !== undefined) updateData.caption = data.caption
  if (data.hashtags !== undefined) updateData.hashtags = data.hashtags
  if (data.scheduled !== undefined) updateData.scheduled = data.scheduled
  if (data.scheduledTime !== undefined) updateData.scheduled_time = data.scheduledTime

  const { error } = await supabase.from("images").update(updateData).eq("id", id).eq("user_id", userId) // Filter by user

  if (error) throw error

  return { id, ...data, userId }
}

export async function deleteImageFromDB(id: string, userId: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("images").delete().eq("id", id).eq("user_id", userId) // Filter by user

  if (error) throw error

  return true
}

export async function markImageAsPosted(id: string, userId: string) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from("images")
    .update({
      posted_at: new Date().toISOString(),
      scheduled: false,
    })
    .eq("id", id)
    .eq("user_id", userId) // Filter by user

  if (error) throw error

  return true
}

// Schedule functions
export async function getScheduleFromDB(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("schedule_settings")
    .select("*")
    .eq("user_id", userId) // Filter by user
    .single()

  if (error) {
    // If no settings exist for this user, create default settings
    if (error.code === "PGRST116") {
      const defaultSettings = {
        enabled: false,
        frequency: "daily",
        time: "12:00",
        days_of_week: [1, 3, 5],
        custom_days: 2,
        user_id: userId,
      }

      await supabase.from("schedule_settings").insert(defaultSettings)

      return {
        enabled: defaultSettings.enabled,
        frequency: defaultSettings.frequency,
        time: defaultSettings.time,
        daysOfWeek: defaultSettings.days_of_week,
        customDays: defaultSettings.custom_days,
      }
    }
    throw error
  }

  return {
    enabled: data.enabled,
    frequency: data.frequency,
    time: data.time,
    daysOfWeek: data.days_of_week,
    customDays: data.custom_days,
  }
}

export async function updateScheduleInDB(
  userId: string,
  settings: {
    enabled: boolean
    frequency: "daily" | "weekly" | "custom"
    time: string
    daysOfWeek: number[]
    customDays: number
  },
) {
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
    .eq("user_id", userId) // Filter by user

  if (error) throw error

  return settings
}

// Instagram functions
export async function getInstagramFromDB(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("instagram_settings")
    .select("*")
    .eq("user_id", userId) // Filter by user
    .single()

  if (error) {
    // If no settings exist for this user, create default settings
    if (error.code === "PGRST116") {
      const defaultSettings = {
        connected: false,
        account_name: "",
        account_id: "",
        access_token: "",
        profile_picture: "",
        user_id: userId,
      }

      await supabase.from("instagram_settings").insert(defaultSettings)

      return {
        connected: false,
        accountName: "",
        accountId: "",
        accessToken: "",
        profilePicture: "",
      }
    }
    throw error
  }

  return {
    connected: data.connected,
    accountName: data.account_name,
    accountId: data.account_id,
    accessToken: data.access_token,
    profilePicture: data.profile_picture,
  }
}

export async function updateInstagramInDB(
  userId: string,
  settings: {
    connected: boolean
    accountName: string
    accountId: string
    accessToken?: string
    profilePicture?: string
  },
) {
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
      user_id: userId, // Add user_id
    }

    if (settings.accessToken !== undefined) updateData.access_token = settings.accessToken
    if (settings.profilePicture !== undefined) updateData.profile_picture = settings.profilePicture

    // Check if a record exists for this user
    const { data: existingRecord, error: checkError } = await supabase
      .from("instagram_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (checkError) {
      // If the error is not found, we need to insert instead of update
      if (checkError.code === "PGRST116") {
        console.log("Instagram settings record not found, creating new record")
        const { error: insertError } = await supabase.from("instagram_settings").insert(updateData)

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
      const { error: updateError } = await supabase
        .from("instagram_settings")
        .update(updateData)
        .eq("id", existingRecord.id)
        .eq("user_id", userId)

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
export async function getSavedPromptsFromDB(userId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("saved_prompts")
    .select("*")
    .eq("user_id", userId) // Filter by user
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((prompt) => ({
    id: prompt.id,
    name: prompt.name,
    prompt: prompt.prompt,
    createdAt: prompt.created_at,
    userId: prompt.user_id,
  }))
}

export async function savePromptToDB(prompt: {
  id: string
  name: string
  prompt: string
  createdAt: string
  userId: string // Add userId
}) {
  const supabase = createServerClient()

  // Check if prompt with this ID already exists
  const { data: existingPrompt } = await supabase
    .from("saved_prompts")
    .select("id")
    .eq("id", prompt.id)
    .eq("user_id", prompt.userId) // Filter by user
    .single()

  if (existingPrompt) {
    // Update existing prompt
    const { error } = await supabase
      .from("saved_prompts")
      .update({
        name: prompt.name,
        prompt: prompt.prompt,
      })
      .eq("id", prompt.id)
      .eq("user_id", prompt.userId) // Filter by user

    if (error) throw error
  } else {
    // Add new prompt
    const { error } = await supabase.from("saved_prompts").insert({
      id: prompt.id,
      name: prompt.name,
      prompt: prompt.prompt,
      created_at: new Date(prompt.createdAt).toISOString(),
      user_id: prompt.userId, // Add user_id
    })

    if (error) throw error
  }

  return prompt
}

export async function deletePromptFromDB(id: string, userId: string) {
  const supabase = createServerClient()

  const { error } = await supabase.from("saved_prompts").delete().eq("id", id).eq("user_id", userId) // Filter by user

  if (error) throw error

  return true
}

