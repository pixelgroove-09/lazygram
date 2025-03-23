// lib/instagram.ts
import { logger } from "./logger"

interface InstagramTokens {
  accessToken: string
  userID: string
  expiresIn: number
  tokenType: string
}

interface InstagramAccount {
  id: string
  name: string
  username: string
  profilePicture: string
  isBusinessAccount: boolean
}

/**
 * Generates the Instagram authorization URL
 */
export async function getInstagramAuthUrl(): Promise<string> {
  try {
    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID) {
      logger.error("INSTAGRAM_APP_ID environment variable is not set")
      throw new Error("Missing Instagram App ID")
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      throw new Error("Missing App URL")
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
    logger.info("Redirect URI:", redirectUri)

    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "pages_read_engagement",
      "pages_show_list",
      "business_management",
    ].join(",")

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${
      process.env.INSTAGRAM_APP_ID
    }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`

    logger.info("Auth URL generated:", authUrl)

    return authUrl
  } catch (error) {
    logger.error("Error generating Instagram auth URL:", error)
    throw error
  }
}

/**
 * Exchanges an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<InstagramTokens> {
  try {
    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
      logger.error("Instagram App credentials are not set")
      throw new Error("Missing Instagram App credentials")
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      throw new Error("Missing App URL")
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
    logger.info("Exchange code for token - Redirect URI:", redirectUri)

    const url = `https://graph.facebook.com/v18.0/oauth/access_token`

    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      redirect_uri: redirectUri,
      code: code,
    })

    logger.info(
      "Making request to:",
      `${url}?${params.toString().replace(process.env.INSTAGRAM_APP_SECRET, "REDACTED")}`,
    )

    const response = await fetch(`${url}?${params.toString()}`)
    const responseText = await response.text()

    if (!response.ok) {
      logger.error("Failed to exchange code for token. Status:", response.status)
      logger.error("Response:", responseText)

      try {
        // Try to parse as JSON to get more detailed error
        const errorJson = JSON.parse(responseText)
        throw new Error(`Failed to exchange code for token: ${errorJson.error?.message || responseText}`)
      } catch (e) {
        // If JSON parsing fails, use the raw error
        throw new Error(`Failed to exchange code for token: ${responseText}`)
      }
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      logger.error("Failed to parse token response:", parseError)
      throw new Error(`Invalid JSON response: ${responseText}`)
    }

    logger.info("Token exchange successful")

    return {
      accessToken: data.access_token,
      userID: data.user_id,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  } catch (error) {
    logger.error("Error exchanging code for token:", error)
    throw error
  }
}

/**
 * Exchanges a short-lived token for a long-lived token (60 days)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  try {
    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
      logger.error("Instagram App credentials are not set")
      throw new Error("Missing Instagram App credentials")
    }

    const url = "https://graph.facebook.com/v18.0/oauth/access_token"

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    })

    logger.info("Making request to get long-lived token")

    const response = await fetch(`${url}?${params.toString()}`)
    const responseText = await response.text()

    if (!response.ok) {
      logger.error("Failed to get long-lived token. Status:", response.status)
      logger.error("Response:", responseText)

      try {
        const errorJson = JSON.parse(responseText)
        throw new Error(`Failed to get long-lived token: ${errorJson.error?.message || responseText}`)
      } catch (e) {
        throw new Error(`Failed to get long-lived token: ${responseText}`)
      }
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      logger.error("Failed to parse long-lived token response:", parseError)
      throw new Error(`Invalid JSON response: ${responseText}`)
    }

    logger.info("Long-lived token obtained successfully")

    return data.access_token
  } catch (error) {
    logger.error("Error getting long-lived token:", error)
    throw error
  }
}

/**
 * Gets the user's Instagram business accounts
 */
export async function getInstagramBusinessAccounts(accessToken: string): Promise<InstagramAccount[]> {
  try {
    logger.info("Getting Instagram business accounts")

    // First, get the user's Facebook pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`

    logger.info("Fetching Facebook pages")
    const pagesResponse = await fetch(pagesUrl)
    const pagesResponseText = await pagesResponse.text()

    if (!pagesResponse.ok) {
      logger.error("Failed to get Facebook pages. Status:", pagesResponse.status)
      logger.error("Response:", pagesResponseText)

      try {
        const errorJson = JSON.parse(pagesResponseText)
        throw new Error(`Failed to get Facebook pages: ${errorJson.error?.message || pagesResponseText}`)
      } catch (e) {
        throw new Error(`Failed to get Facebook pages: ${pagesResponseText}`)
      }
    }

    let pagesData
    try {
      pagesData = JSON.parse(pagesResponseText)
    } catch (parseError) {
      logger.error("Failed to parse Facebook pages response:", parseError)
      throw new Error(`Invalid JSON response: ${pagesResponseText}`)
    }

    logger.info(`Found ${pagesData.data?.length || 0} Facebook pages`)

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook pages found. You need a Facebook page connected to your Instagram business account.")
    }

    // For each page, check if it has an Instagram Business account
    const instagramAccounts: InstagramAccount[] = []

    for (const page of pagesData.data) {
      logger.info(`Checking Instagram account for page: ${page.name} (${page.id})`)

      const igAccountUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${accessToken}`

      const igResponse = await fetch(igAccountUrl)
      const igResponseText = await igResponse.text()

      if (!igResponse.ok) {
        logger.warn(`Failed to get Instagram account for page ${page.name}. Status:`, igResponse.status)
        logger.warn("Response:", igResponseText)
        continue
      }

      let igData
      try {
        igData = JSON.parse(igResponseText)
      } catch (parseError) {
        logger.warn(`Failed to parse Instagram account response for page ${page.name}:`, parseError)
        continue
      }

      if (igData.instagram_business_account) {
        logger.info(`Found Instagram business account for page ${page.name}`)

        // Get profile picture if it's not included in the response
        let profilePic = igData.instagram_business_account.profile_picture_url || ""

        if (!profilePic && igData.instagram_business_account.id) {
          try {
            const profileResponse = await fetch(
              `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=profile_picture_url&access_token=${accessToken}`,
            )
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              profilePic = profileData.profile_picture_url || ""
            }
          } catch (error) {
            logger.warn("Failed to fetch profile picture", error)
          }
        }

        instagramAccounts.push({
          id: igData.instagram_business_account.id,
          name: igData.instagram_business_account.name || page.name,
          username: igData.instagram_business_account.username || "",
          profilePicture: profilePic,
          isBusinessAccount: true,
        })
      } else {
        logger.info(`No Instagram business account found for page ${page.name}`)
      }
    }

    logger.info(`Found ${instagramAccounts.length} Instagram business accounts`)

    if (instagramAccounts.length === 0) {
      throw new Error(
        "No Instagram business accounts found. Make sure your Instagram account is a business account and connected to your Facebook page.",
      )
    }

    return instagramAccounts
  } catch (error) {
    logger.error("Error getting Instagram business accounts:", error)
    throw error
  }
}

/**
 * Validate the access token
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    logger.debug("Validating Instagram access token")
    const url = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Token validation failed with status ${response.status}: ${errorText}`)
      return false
    }

    const data = await response.json()
    logger.debug("Token validation response:", data)

    // Check if the token is valid and not expired
    if (data.data && data.data.is_valid) {
      // Check expiration (if available)
      if (data.data.expires_at && data.data.expires_at < Math.floor(Date.now() / 1000)) {
        logger.warn("Token expired")
        return false
      }
      logger.debug("Token is valid")
      return true
    }

    logger.warn("Token is invalid:", data.data?.error?.message || "No error message provided")
    return false
  } catch (error) {
    logger.error("Error validating token:", error)
    return false
  }
}

// Add a function to help debug environment variables
export function getInstagramEnvironmentStatus() {
  return {
    INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ? "Set" : "Not set",
    INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET ? "Set" : "Not set",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    USE_MOCK_INSTAGRAM: process.env.USE_MOCK_INSTAGRAM || "Not set",
  }
}

