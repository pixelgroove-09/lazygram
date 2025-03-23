"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

interface ProfileData {
  name: string
}

export async function updateProfile(data: ProfileData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    const supabase = createServerClient()

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name: data.name,
      },
    })

    if (updateError) {
      return { error: updateError.message }
    }

    // Update user profile in the database
    const { error: profileError } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      name: data.name,
      email: user.email,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Error updating user profile:", profileError)
      // Continue anyway, as the auth user was updated
    }

    revalidatePath("/profile")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "An unexpected error occurred" }
  }
}

