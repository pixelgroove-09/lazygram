import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

// Get the current session (cached)
export const getSession = cache(async () => {
  const cookieStore = cookies()
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
})

// Get the current user
export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return session.user
}

// Check if user is authenticated, redirect to login if not
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

// Check if user is authenticated, redirect to dashboard if yes
export async function requireGuest() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }
}

