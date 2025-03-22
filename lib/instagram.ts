// lib/instagram.ts

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
 * Validates if an Instagram token is still valid
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    if (!accessToken) {
      console.log("No access token provided for validation")
      return false
    }

    console.log("Validating Instagram access token")
    const url = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`

    const response = await fetch(url)
    const data = await response.json()

    console.log("Token validation response:", JSON.stringify(data, null, 2))

    // Check if the token is valid and not expired
    if (response.ok && data.data && data.data.is_valid) {
      // Check expiration (if available)
      if (data.data.expires_at && data.data.expires_at < Math.floor(Date.now() / 1000)) {
        console.log("Token expired")
        return false
      }
      console.log("Token is valid")
      return true
    }

    console.log("Token is invalid")
    return false
  } catch (error) {
    console.error("Error validating token:", error)
    return false
  }
}

/**
 * Generates the Instagram authorization URL
 */
export async function getInstagramAuthUrl(): Promise<string> {
  try {
    // Check if environment variables are set
    if (!process.env.INSTAGRAM_APP_ID) {
      console.error("INSTAGRAM_APP_ID environment variable is not set")
      throw new Error("Missing Instagram App ID")
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      throw new Error("Missing App URL")
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
    console.log("Redirect URI:", redirectUri)

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

    console.log("Auth URL generated:", authUrl)

    return authUrl
  } catch (error) {
    console.error("Error generating Instagram auth URL:", error)
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
      console.error("Instagram App credentials are not set")
      throw new Error("Missing Instagram App credentials")
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      throw new Error("Missing App URL")
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
    console.log("Exchange code for token - Redirect URI:", redirectUri)

    const url = `https://graph.facebook.com/v18.0/oauth/access_token`

    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      redirect_uri: redirectUri,
      code: code,
    })

    console.log(
      "Making request to:",
      `${url}?${params.toString().replace(process.env.INSTAGRAM_APP_SECRET, "REDACTED")}`,
    )

    const response = await fetch(`${url}?${params.toString()}`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Failed to exchange code for token. Status:", response.status)
      console.error("Response:", errorData)

      try {
        // Try to parse as JSON to get more detailed error
        const errorJson = JSON.parse(errorData)
        throw new Error(`Failed to exchange code for token: ${errorJson.error?.message || errorData}`)
      } catch (e) {
        // If JSON parsing fails, use the raw error
        throw new Error(`Failed to exchange code for token: ${errorData}`)
      }
    }

    const data = await response.json()
    console.log("Token exchange successful")

    return {
      accessToken: data.access_token,
      userID: data.user_id,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  } catch (error) {
    console.error("Error exchanging code for token:", error)
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
      console.error("Instagram App credentials are not set")
      throw new Error("Missing Instagram App credentials")
    }

    const url = "https://graph.facebook.com/v18.0/oauth/access_token"

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.INSTAGRAM_APP_ID,
      client_secret: process.env.INSTAGRAM_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    })

    console.log("Making request to get long-lived token")

    const response = await fetch(`${url}?${params.toString()}`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Failed to get long-lived token. Status:", response.status)
      console.error("Response:", errorData)

      try {
        const errorJson = JSON.parse(errorData)
        throw new Error(`Failed to get long-lived token: ${errorJson.error?.message || errorData}`)
      } catch (e) {
        throw new Error(`Failed to get long-lived token: ${errorData}`)
      }
    }

    const data = await response.json()
    console.log("Long-lived token obtained successfully")

    return data.access_token
  } catch (error) {
    console.error("Error getting long-lived token:", error)
    throw error
  }
}

/**
 * Gets the user's Instagram business accounts
 */
export async function getInstagramBusinessAccounts(accessToken: string): Promise<InstagramAccount[]> {
  try {
    console.log("Getting Instagram business accounts")

    // First, get the user's Facebook pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`

    console.log("Fetching Facebook pages")
    const pagesResponse = await fetch(pagesUrl)

    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.text()
      console.error("Failed to get Facebook pages. Status:", pagesResponse.status)
      console.error("Response:", errorData)

      try {
        const errorJson = JSON.parse(errorData)
        throw new Error(`Failed to get Facebook pages: ${errorJson.error?.message || errorData}`)
      } catch (e) {
        throw new Error(`Failed to get Facebook pages: ${errorData}`)
      }
    }

    const pagesData = await pagesResponse.json()
    console.log(`Found ${pagesData.data.length} Facebook pages`)

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook pages found. You need a Facebook page connected to your Instagram business account.")
    }

    // For each page, check if it has an Instagram Business account
    const instagramAccounts: InstagramAccount[] = []

    for (const page of pagesData.data) {
      console.log(`Checking Instagram account for page: ${page.name} (${page.id})`)

      const igAccountUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${accessToken}`

      const igResponse = await fetch(igAccountUrl)

      if (!igResponse.ok) {
        console.warn(`Failed to get Instagram account for page ${page.name}. Status:`, igResponse.status)
        const errorData = await igResponse.text()
        console.warn("Response:", errorData)
        continue
      }

      const igData = await igResponse.json()

      if (igData.instagram_business_account) {
        console.log(`Found Instagram business account for page ${page.name}`)

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
            console.warn("Failed to fetch profile picture", error)
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
        console.log(`No Instagram business account found for page ${page.name}`)
      }
    }

    console.log(`Found ${instagramAccounts.length} Instagram business accounts`)

    if (instagramAccounts.length === 0) {
      throw new Error(
        "No Instagram business accounts found. Make sure your Instagram account is a business account and connected to your Facebook page.",
      )
    }

    return instagramAccounts
  } catch (error) {
    console.error("Error getting Instagram business accounts:", error)
    throw error
  }
}

/**
 * Posts an image to Instagram
 */
export async function postToInstagram(
  accessToken: string,
  instagramAccountId: string,
  imageUrl: string,
  caption: string,
): Promise<string> {
  try {
    console.log("Posting to Instagram")
    console.log("Instagram Account ID:", instagramAccountId)
    console.log("Image URL:", imageUrl)
    console.log("Caption length:", caption.length)

    // Step 1: Create a container
    const containerUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`

    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    })

    console.log("Creating media container")
    const containerResponse = await fetch(`${containerUrl}?${containerParams.toString()}`, {
      method: "POST",
    })

    if (!containerResponse.ok) {
      const errorData = await containerResponse.text()
      console.error("Failed to create media container. Status:", containerResponse.status)
      console.error("Response:", errorData)

      try {
        const errorJson = JSON.parse(errorData)
        // Extract useful error info from Facebook's error response
        const errorMsg = errorJson.error?.message || errorJson.error?.error_user_msg || errorData
        throw new Error(`Failed to create media container: ${errorMsg}`)
      } catch (e) {
        throw new Error(`Failed to create media container: ${errorData}`)
      }
    }

    const containerData = await containerResponse.json()
    const containerId = containerData.id
    console.log("Media container created with ID:", containerId)

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`

    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    })

    console.log("Publishing media container")

    // Wait a moment to ensure the container is ready (sometimes Instagram API needs a moment)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
      method: "POST",
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text()
      console.error("Failed to publish media. Status:", publishResponse.status)
      console.error("Response:", errorData)

      try {
        const errorJson = JSON.parse(errorData)
        const errorMsg = errorJson.error?.message || errorJson.error?.error_user_msg || errorData
        throw new Error(`Failed to publish media: ${errorMsg}`)
      } catch (e) {
        throw new Error(`Failed to publish media: ${errorData}`)
      }
    }

    const publishData = await publishResponse.json()
    console.log("Media published successfully with ID:", publishData.id)

    return publishData.id
  } catch (error) {
    console.error("Error posting to Instagram:", error)
    throw error
  }
}

