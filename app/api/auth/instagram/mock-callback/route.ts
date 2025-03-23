import { type NextRequest, NextResponse } from "next/server"
import { mockInstagramAuth } from "@/lib/instagram-mock"
import { updateInstagramInDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Mock Instagram callback route called")

    // Simulate a successful authentication
    console.log("Calling mockInstagramAuth()")
    const mockAuth = await mockInstagramAuth()
    console.log("Mock auth result:", mockAuth)

    if (!mockAuth.success || !mockAuth.account) {
      console.error("Mock authentication failed:", mockAuth.error || "No account returned")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=mock_auth_failed&error_description=${encodeURIComponent(mockAuth.error || "Mock authentication failed")}`,
      )
    }

    try {
      console.log("Saving mock Instagram account to database")
      // Save the mock Instagram account info to the database
      await updateInstagramInDB({
        connected: true,
        accountName: mockAuth.account.username,
        accountId: mockAuth.account.id,
        accessToken: "mock_access_token_" + Math.random().toString(36).substring(2, 15),
        profilePicture: mockAuth.account.profilePicture,
      })

      console.log("Mock Instagram account saved to database")
    } catch (dbError: any) {
      console.error("Database error when saving mock account:", dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=database_error&error_description=${encodeURIComponent("Failed to save mock account to database: " + dbError.message)}`,
      )
    }

    // Redirect back to the settings page
    console.log("Redirecting to settings page with success")
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`)
  } catch (error: any) {
    console.error("Mock Instagram callback error:", error)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=mock_auth_failed&error_description=${encodeURIComponent(error.message || "Mock authentication failed")}&error_debug=${encodeURIComponent(JSON.stringify(error))}`,
    )
  }
}

