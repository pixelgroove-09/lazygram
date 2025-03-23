import { NextResponse } from "next/server"
import { createServerSupabaseClient, getUserId } from "@/lib/supabase/server"

export async function GET() {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ connected: false, details: "User not authenticated" }, { status: 200 })
    }

    const supabase = createServerSupabaseClient()

    // Check instagram_accounts table
    const { data: accountData, error: accountError } = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Check instagram_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from("instagram_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    const connected = !!accountData && !!settingsData?.connected

    let details = ""
    if (!accountData) {
      details += "No Instagram account found. "
    }
    if (accountError) {
      details += `Account error: ${accountError.message}. `
    }
    if (!settingsData) {
      details += "No Instagram settings found. "
    }
    if (settingsError) {
      details += `Settings error: ${settingsError.message}. `
    }
    if (accountData && settingsData) {
      details = `Connected to Instagram account: ${settingsData.account_name || accountData.username}`

      // Check if token is expired
      if (accountData.token_expires_at) {
        const expiresAt = new Date(accountData.token_expires_at)
        const now = new Date()

        if (expiresAt < now) {
          details += ". WARNING: Access token has expired. Please reconnect your account."
        } else {
          // Calculate days until expiration
          const daysUntilExpiration = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          details += `. Access token valid for ${daysUntilExpiration} more days.`
        }
      }
    }

    return NextResponse.json({ connected, details })
  } catch (error) {
    console.error("Error checking connection:", error)
    return NextResponse.json({ connected: false, details: "An unexpected error occurred" }, { status: 200 })
  }
}

