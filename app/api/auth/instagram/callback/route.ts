import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForToken, getLongLivedToken, getInstagramBusinessAccounts } from "@/lib/instagram"
import { updateInstagramInDB } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Instagram callback route called")

    // Get the authorization code from the URL
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorReason = searchParams.get("error_reason")
    const errorDescription = searchParams.get("error_description")

    // Check for errors from Facebook
    if (error) {
      console.error("Error from Facebook:", error, errorReason, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${error}&error_description=${encodeURIComponent(errorDescription || "")}`,
      )
    }

    if (!code) {
      console.error("No code provided in callback")
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`)
    }

    console.log("Code received, exchanging for token")

    try {
      // Exchange the code for an access token
      const tokens = await exchangeCodeForToken(code)

      console.log("Token received, exchanging for long-lived token")

      // Exchange short-lived token for a long-lived token
      const longLivedToken = await getLongLivedToken(tokens.accessToken)

      console.log("Long-lived token received, getting Instagram business accounts")

      // Get the user's Instagram business accounts
      const instagramAccounts = await getInstagramBusinessAccounts(longLivedToken)

      if (instagramAccounts.length === 0) {
        console.error("No Instagram business accounts found")
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_business_account`)
      }

      // Use the first Instagram business account
      const instagramAccount = instagramAccounts[0]
      console.log("Using Instagram account:", instagramAccount.username)

      // Save the Instagram account info to the database
      await updateInstagramInDB({
        connected: true,
        accountName: instagramAccount.username,
        accountId: instagramAccount.id,
        accessToken: longLivedToken,
        profilePicture: instagramAccount.profilePicture,
      })

      console.log("Instagram account saved to database")

      // Redirect back to the settings page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`)
    } catch (tokenError) {
      console.error("Error during token exchange:", tokenError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed&error_description=${encodeURIComponent(tokenError.message)}`,
      )
    }
  } catch (error) {
    console.error("Instagram callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed&error_description=${encodeURIComponent(error.message)}`,
    )
  }
}

