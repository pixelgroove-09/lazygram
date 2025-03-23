import { createClient } from "@supabase/supabase-js"

// Singleton instance for client-side
let supabaseClient: ReturnType<typeof createClient> | null = null

// Create a client-side client
export function createClientClient() {
  if (supabaseClient) return supabaseClient

  // Create a new Supabase client if one doesn't exist
  supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

// Create a server client (for API routes)
export function createServerClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

