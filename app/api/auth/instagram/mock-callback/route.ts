import { type NextRequest, NextResponse } from "next/server"
import { mockInstagramAuth } from "@/lib/instagram-mock"
import { updateInstagramInDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Mock Instagram callback route called")

    // Simulate a successful authentication
    const mockAuth = await mockInstagramAuth()

    if (!mockAuth.success || !mockAuth.account) {
      console.error("Mock authentication failed")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=mock_auth_failed&error_description=${encodeURIComponent("Mock authentication failed")}`,
      )
    }

    // Save the mock Instagram account info to the database
    await updateInstagramInDB({
      connected: true,
      accountName: mockAuth.account.username,
      accountId: mockAuth.account.id,
      accessToken: "mock_access_token_" + Math.random().toString(36).substring(2, 15),
      profilePicture: mockAuth.account.profilePicture,
    })

    console.log("Mock Instagram account saved to database")

    // Redirect back to the settings page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`)
  } catch (error: any) {
    console.error("Mock Instagram callback error:", error)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=mock_auth_failed&error_description=${encodeURIComponent(error.message || "Mock authentication failed")}`,
    )
  }
}

