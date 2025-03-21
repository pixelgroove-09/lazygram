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

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`
    console.log("Auth URL generated:", authUrl)

    return authUrl
  } catch (error) {
    console.error("Error generating Instagram auth URL:", error)
    throw error
  }
}

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

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log("Response status:", response.status)

    if (!response.ok) {
      console.error("Failed to exchange code for token. Status:", response.status)
      console.error("Response:", responseText)
      throw new Error(`Failed to exchange code for token: ${responseText}`)
    }

    const data = JSON.parse(responseText)
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

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error("Failed to get long-lived token. Status:", response.status)
      console.error("Response:", responseText)
      throw new Error(`Failed to get long-lived token: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log("Long-lived token obtained successfully")

    return data.access_token
  } catch (error) {
    console.error("Error getting long-lived token:", error)
    throw error
  }
}

export async function getInstagramBusinessAccounts(accessToken: string): Promise<InstagramAccount[]> {
  try {
    console.log("Getting Instagram business accounts")

    // First, get the user's Facebook pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`

    console.log("Fetching Facebook pages")
    const pagesResponse = await fetch(pagesUrl)
    const pagesResponseText = await pagesResponse.text()

    if (!pagesResponse.ok) {
      console.error("Failed to get Facebook pages. Status:", pagesResponse.status)
      console.error("Response:", pagesResponseText)
      throw new Error(`Failed to get Facebook pages: ${pagesResponseText}`)
    }

    const pagesData = JSON.parse(pagesResponseText)
    console.log(`Found ${pagesData.data.length} Facebook pages`)

    // For each page, check if it has an Instagram Business account
    const instagramAccounts: InstagramAccount[] = []

    for (const page of pagesData.data) {
      console.log(`Checking Instagram account for page: ${page.name} (${page.id})`)

      const igAccountUrl = `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${accessToken}`

      const igResponse = await fetch(igAccountUrl)
      const igResponseText = await igResponse.text()

      if (!igResponse.ok) {
        console.warn(`Failed to get Instagram account for page ${page.name}. Status:`, igResponse.status)
        console.warn("Response:", igResponseText)
        continue
      }

      const igData = JSON.parse(igResponseText)

      if (igData.instagram_business_account) {
        console.log(`Found Instagram business account for page ${page.name}`)

        instagramAccounts.push({
          id: igData.instagram_business_account.id,
          name: igData.instagram_business_account.name || page.name,
          username: igData.instagram_business_account.username || "",
          profilePicture: igData.instagram_business_account.profile_picture_url || "",
          isBusinessAccount: true,
        })
      } else {
        console.log(`No Instagram business account found for page ${page.name}`)
      }
    }

    console.log(`Found ${instagramAccounts.length} Instagram business accounts`)
    return instagramAccounts
  } catch (error) {
    console.error("Error getting Instagram business accounts:", error)
    throw error
  }
}

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

    const containerResponseText = await containerResponse.text()

    if (!containerResponse.ok) {
      console.error("Failed to create media container. Status:", containerResponse.status)
      console.error("Response:", containerResponseText)
      throw new Error(`Failed to create media container: ${containerResponseText}`)
    }

    const containerData = JSON.parse(containerResponseText)
    const containerId = containerData.id
    console.log("Media container created with ID:", containerId)

    // Step 2: Publish the container
    const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`

    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    })

    console.log("Publishing media container")
    const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
      method: "POST",
    })

    const publishResponseText = await publishResponse.text()

    if (!publishResponse.ok) {
      console.error("Failed to publish media. Status:", publishResponse.status)
      console.error("Response:", publishResponseText)
      throw new Error(`Failed to publish media: ${publishResponseText}`)
    }

    const publishData = JSON.parse(publishResponseText)
    console.log("Media published successfully with ID:", publishData.id)

    return publishData.id
  } catch (error) {
    console.error("Error posting to Instagram:", error)
    throw error
  }
}

