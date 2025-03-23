import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForToken, getLongLivedToken, getInstagramBusinessAccounts } from "@/lib/instagram"
import { updateInstagramInDB } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info("Instagram callback route called")

    // Get the authorization code from the URL
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorReason = searchParams.get("error_reason")
    const errorDescription = searchParams.get("error_description")

    // Check for errors from Facebook
    if (error) {
      logger.error("Error from Facebook:", error, errorReason, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${error}&error_description=${encodeURIComponent(errorDescription || "")}`,
      )
    }

    if (!code) {
      logger.error("No code provided in callback")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code&error_description=${encodeURIComponent("No authorization code received from Instagram")}`,
      )
    }

    logger.info("Code received, exchanging for token")

    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
      logger.error("Instagram App credentials are not set")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_credentials&error_description=${encodeURIComponent("Instagram App ID or Secret is not configured")}`,
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/settings?error=missing_app_url&error_description=${encodeURIComponent("App URL is not configured")}`,
      )
    }

    try {
      // Exchange the code for an access token
      const tokens = await exchangeCodeForToken(code)

      logger.info("Token received, exchanging for long-lived token")

      // Exchange short-lived token for a long-lived token
      const longLivedToken = await getLongLivedToken(tokens.accessToken)

      logger.info("Long-lived token received, getting Instagram business accounts")

      // Get the user's Instagram business accounts
      const instagramAccounts = await getInstagramBusinessAccounts(longLivedToken)

      if (instagramAccounts.length === 0) {
        logger.error("No Instagram business accounts found")
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_business_account&error_description=${encodeURIComponent("No Instagram business accounts found. Please connect an Instagram business account to your Facebook page.")}`,
        )
      }

      // Use the first Instagram business account
      const instagramAccount = instagramAccounts[0]
      logger.info("Using Instagram account:", instagramAccount.username)

      // Save the Instagram account info to the database
      await updateInstagramInDB({
        connected: true,
        accountName: instagramAccount.username,
        accountId: instagramAccount.id,
        accessToken: longLivedToken,
        profilePicture: instagramAccount.profilePicture,
      })

      logger.info("Instagram account saved to database")

      // Redirect back to the settings page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`)
    } catch (tokenError: any) {
      logger.error("Error during token exchange:", tokenError)

      // Create a more detailed error message
      const errorMessage = tokenError.message || "Failed to exchange authorization code for token"
      const errorDebug = JSON.stringify({
        message: tokenError.message,
        stack: tokenError.stack,
        name: tokenError.name,
      })

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed&error_description=${encodeURIComponent(errorMessage)}&error_debug=${encodeURIComponent(errorDebug)}`,
      )
    }
  } catch (error: any) {
    logger.error("Instagram callback error:", error)

    // Create a more detailed error message
    const errorMessage = error.message || "Authentication failed"
    const errorDebug = JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed&error_description=${encodeURIComponent(errorMessage)}&error_debug=${encodeURIComponent(errorDebug)}`,
    )
  }
}

