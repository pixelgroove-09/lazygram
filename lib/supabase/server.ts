import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
    },
  })

  return supabase
}

export async function getServerSession() {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error.message)
      return null
    }

    return session
  } catch (error) {
    console.error("Unexpected error getting session:", error)
    return null
  }
}

export async function getUserId() {
  const session = await getServerSession()
  return session?.user?.id
}

