import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("Direct connect endpoint called")

    // Create a mock Instagram account
    const mockAccount = {
      connected: true,
      account_name: "mock_instagram_user",
      account_id: "mock_" + Math.random().toString(36).substring(2, 10),
      access_token: "mock_token_" + Math.random().toString(36).substring(2, 15),
      profile_picture: "https://via.placeholder.com/150",
    }

    console.log("Created mock account:", mockAccount)

    // Connect directly to the database
    try {
      const supabase = createServerClient()

      // Check if a record with id=1 exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("instagram_settings")
        .select("id")
        .eq("id", 1)
        .single()

      if (checkError) {
        // If the error is not found, we need to insert instead of update
        if (checkError.code === "PGRST116") {
          console.log("Instagram settings record not found, creating new record")

          // Insert a new record
          const { error: insertError } = await supabase.from("instagram_settings").insert({
            id: 1,
            ...mockAccount,
          })

          if (insertError) {
            console.error("Error inserting Instagram settings:", insertError)
            return NextResponse.json(
              {
                error: "database_error",
                message: "Failed to insert Instagram settings: " + insertError.message,
              },
              { status: 500 },
            )
          }

          console.log("Inserted new Instagram settings record")
        } else {
          console.error("Error checking Instagram settings:", checkError)
          return NextResponse.json(
            {
              error: "database_error",
              message: "Failed to check Instagram settings: " + checkError.message,
            },
            { status: 500 },
          )
        }
      } else {
        // Update existing record
        const { error: updateError } = await supabase.from("instagram_settings").update(mockAccount).eq("id", 1)

        if (updateError) {
          console.error("Error updating Instagram settings:", updateError)
          return NextResponse.json(
            {
              error: "database_error",
              message: "Failed to update Instagram settings: " + updateError.message,
            },
            { status: 500 },
          )
        }

        console.log("Updated existing Instagram settings record")
      }
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        {
          error: "database_error",
          message: "Database operation failed: " + (dbError.message || "Unknown database error"),
        },
        { status: 500 },
      )
    }

    // Add a small delay to ensure the database operation completes
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: "Mock Instagram account connected successfully",
      account: {
        username: mockAccount.account_name,
        id: mockAccount.account_id,
      },
    })
  } catch (error) {
    console.error("Direct connect error:", error)
    return NextResponse.json(
      {
        error: "connection_failed",
        message: "Failed to connect mock Instagram account: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}

