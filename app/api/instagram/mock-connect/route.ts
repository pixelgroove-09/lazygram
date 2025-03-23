import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase" // Updated import path
import { getUserId } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Check if mock mode is enabled
    const useMock = process.env.USE_MOCK_INSTAGRAM === "true"

    if (!useMock) {
      return NextResponse.json({ message: "Mock mode is not enabled" }, { status: 400 })
    }

    // Get the user ID
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json({ message: "User not authenticated" }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Create a mock Instagram account
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days from now

    // Check if an account already exists
    const { data: existingAccount } = await supabase
      .from("instagram_accounts")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingAccount) {
      // Update the existing account
      await supabase
        .from("instagram_accounts")
        .update({
          username,
          instagram_user_id: `mock_${Math.floor(Math.random() * 1000000000)}`,
          access_token: "MOCK_ACCESS_TOKEN_FOR_TESTING",
          token_expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingAccount.id)
    } else {
      // Create a new account
      await supabase.from("instagram_accounts").insert({
        user_id: userId,
        username,
        instagram_user_id: `mock_${Math.floor(Math.random() * 1000000000)}`,
        access_token: "MOCK_ACCESS_TOKEN_FOR_TESTING",
        token_expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
    }

    // Update the Instagram settings
    const { data: existingSettings } = await supabase
      .from("instagram_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (existingSettings) {
      // Update the existing settings
      await supabase
        .from("instagram_settings")
        .update({
          connected: true,
          account_name: username,
          account_id: `mock_${Math.floor(Math.random() * 1000000000)}`,
          access_token: "MOCK_ACCESS_TOKEN_FOR_TESTING",
          profile_picture: `https://v0.dev/placeholder.svg?height=150&width=150&text=${username.charAt(0).toUpperCase()}`,
          updated_at: now.toISOString(),
        })
        .eq("id", existingSettings.id)
    } else {
      // Create new settings
      await supabase.from("instagram_settings").insert({
        user_id: userId,
        connected: true,
        account_name: username,
        account_id: `mock_${Math.floor(Math.random() * 1000000000)}`,
        access_token: "MOCK_ACCESS_TOKEN_FOR_TESTING",
        profile_picture: `https://v0.dev/placeholder.svg?height=150&width=150&text=${username.charAt(0).toUpperCase()}`,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Instagram as ${username} (MOCK MODE)`,
    })
  } catch (error) {
    console.error("Error connecting to Instagram:", error)
    return NextResponse.json(
      {
        message: "Failed to connect to Instagram",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

