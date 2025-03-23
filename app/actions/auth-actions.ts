"use server"

import { createServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

export async function loginUser(data: LoginData) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function registerUser(data: RegisterData) {
  try {
    const supabase = createServerClient()

    // Sign up the user
    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    })

    if (signUpError) {
      return { error: signUpError.message }
    }

    // Create user profile in the database
    const { error: profileError } = await supabase.from("user_profiles").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      name: data.name,
      email: data.email,
    })

    if (profileError) {
      console.error("Error creating user profile:", profileError)
      // Continue anyway, as the auth user was created
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function logoutUser() {
  try {
    const supabase = createServerClient()
    await supabase.auth.signOut()

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { error: "An unexpected error occurred" }
  }
}

