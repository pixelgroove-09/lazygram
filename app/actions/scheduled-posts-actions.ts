"use server"

import { createServerSupabaseClient, getUserId } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getScheduledPost(id: string) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("scheduled_posts").select("*").eq("id", id).eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching scheduled post:", error)
    throw new Error("Failed to fetch scheduled post")
  }

  return data
}

export async function deleteScheduledPost(id: string) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("scheduled_posts").delete().eq("id", id).eq("user_id", userId)

  if (error) {
    console.error("Error deleting scheduled post:", error)
    throw new Error("Failed to delete scheduled post")
  }

  revalidatePath("/schedule")
  return { success: true }
}

export async function updateScheduledPost(id: string, data: any) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from("scheduled_posts")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating scheduled post:", error)
    throw new Error("Failed to update scheduled post")
  }

  revalidatePath("/schedule")
  return { success: true }
}

export async function createScheduledPost(data: any) {
  const userId = await getUserId()

  if (!userId) {
    throw new Error("User not authenticated")
  }

  const supabase = createServerSupabaseClient()

  // Get the user's Instagram account
  const { data: accountData, error: accountError } = await supabase
    .from("instagram_accounts")
    .select("id")
    .eq("user_id", userId)
    .single()

  if (accountError) {
    console.error("Error fetching Instagram account:", accountError)
    throw new Error("No Instagram account found. Please connect your account first.")
  }

  const { error } = await supabase.from("scheduled_posts").insert({
    ...data,
    user_id: userId,
    instagram_account_id: accountData.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error creating scheduled post:", error)
    throw new Error("Failed to create scheduled post")
  }

  revalidatePath("/schedule")
  return { success: true }
}

