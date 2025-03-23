import { createServerClient } from "./supabase"
import { logger } from "./logger"

// Types
export interface InstagramError {
  code: number
  message: string
  type: string
  subcode?: number
  fbtrace_id?: string
}

export interface InstagramErrorResponse {
  error: InstagramError
}

export interface InstagramMediaContainer {
  id: string
  status?: string
}

export interface InstagramPostResult {
  id: string
  status: "SUCCESS" | "ERROR" | "PENDING"
  message?: string
  permalink?: string
}

// Instagram Graph API endpoints
const GRAPH_API_URL = "https://graph.facebook.com/v18.0"

// Rate limiting constants
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const RATE_LIMIT_CODES = [4, 17, 32, 613]

interface InstagramCredentials {
  accessToken: string
  accountId: string
}

interface PostResult {
  success: boolean
  postId?: string
  error?: string
  details?: any
  rateLimited?: boolean
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  details?: any
  rateLimited?: boolean
  retryAfter?: number
}

/**
 * Instagram API client for posting content
 */
export class InstagramApiClient {
  private accessToken: string
  private accountId: string
  private requestCount = 0
  private lastRequestTime = 0
  private mockMode: boolean

  constructor(accessToken: string, accountId: string, mockMode = false) {
    this.accessToken = accessToken
    this.accountId = accountId
    this.mockMode = mockMode || process.env.USE_MOCK_INSTAGRAM === "true"
  }

  /**
   * Post an image to Instagram
   */
  async postImage(imageUrl: string, caption: string): Promise<PostResult> {
    try {
      logger.info(`Posting to Instagram account ${this.accountId}`)
      logger.info(`Image URL: ${imageUrl}`)
      logger.info(`Caption length: ${caption.length} characters`)

      // Step 1: Create a container for the media
      logger.info("Step 1: Creating media container")
      const containerResult = await this.createMediaContainer(imageUrl, caption)

      if (!containerResult.success) {
        return {
          success: false,
          error: containerResult.error || "Failed to create media container",
          details: containerResult.details,
          rateLimited: containerResult.rateLimited,
        }
      }

      const containerId = containerResult.data.id
      if (!containerId) {
        return {
          success: false,
          error: "No container ID returned from API",
          details: containerResult.data,
        }
      }

      // Step 2: Publish the container
      logger.info(`Step 2: Publishing media container ${containerId}`)
      const publishResult = await this.publishMediaContainer(containerId)

      if (!publishResult.success) {
        return {
          success: false,
          error: publishResult.error || "Failed to publish media container",
          details: publishResult.details,
          rateLimited: publishResult.rateLimited,
        }
      }

      const postId = publishResult.data.id
      if (!postId) {
        return {
          success: false,
          error: "No post ID returned from API",
          details: publishResult.data,
        }
      }

      logger.info(`Successfully posted to Instagram with ID: ${postId}`)
      return {
        success: true,
        postId,
      }
    } catch (error) {
      logger.error("Error posting to Instagram:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred during Instagram posting",
        details: error,
      }
    }
  }

  /**
   * Create a media container
   */
  private async createMediaContainer(imageUrl: string, caption: string): Promise<ApiResponse> {
    try {
      const url = `${GRAPH_API_URL}/${this.accountId}/media`

      // Check if the image URL is valid
      if (!imageUrl || !imageUrl.startsWith("http")) {
        throw new Error(`Invalid image URL: ${imageUrl}`)
      }

      // Try to fetch the image first to verify it's accessible
      try {
        logger.info("Verifying image URL is accessible...")
        const imageCheck = await fetch(imageUrl, {
          method: "HEAD",
          headers: {
            Accept: "image/*",
          },
        })

        if (!imageCheck.ok) {
          throw new Error(`Image URL is not accessible: ${imageCheck.status} ${imageCheck.statusText}`)
        }

        const contentType = imageCheck.headers.get("content-type")
        logger.info(`Image URL is accessible. Content-Type: ${contentType}`)

        if (contentType && !contentType.startsWith("image/")) {
          throw new Error(`URL does not point to an image. Content-Type: ${contentType}`)
        }
      } catch (imageError) {
        logger.error("Error verifying image URL:", imageError)
        throw new Error(`Image URL verification failed: ${imageError.message}`)
      }

      const params = new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: this.accessToken,
      })

      logger.info("Creating media container")

      // Log the URL being used (without the access token for security)
      const sanitizedUrl = `${url}?image_url=${encodeURIComponent(imageUrl)}&caption=[CAPTION]&access_token=[REDACTED]`
      logger.info(`Request URL: ${sanitizedUrl}`)

      // Apply rate limiting
      await this.applyRateLimit()

      // Send the request with retry logic
      return await this.sendRequestWithRetry("POST", `${url}?${params.toString()}`)
    } catch (error) {
      logger.error("Error creating media container:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error creating media container",
        details: error,
      }
    }
  }

  /**
   * Publish a media container
   */
  private async publishMediaContainer(containerId: string): Promise<ApiResponse> {
    try {
      const url = `${GRAPH_API_URL}/${this.accountId}/media_publish`

      const params = new URLSearchParams({
        creation_id: containerId,
        access_token: this.accessToken,
      })

      logger.info(`Publishing media container: ${containerId}`)

      // Wait longer to ensure the container is ready
      logger.info("Waiting 8 seconds before publishing...")
      await new Promise((resolve) => setTimeout(resolve, 8000))
      logger.info("Wait complete, publishing container...")

      // Apply rate limiting
      await this.applyRateLimit()

      // Send the request with retry logic
      return await this.sendRequestWithRetry("POST", `${url}?${params.toString()}`)
    } catch (error) {
      logger.error("Error publishing media container:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error publishing media container",
        details: error,
      }
    }
  }

  /**
   * Send a request to the Instagram API with retry logic for rate limiting
   */
  private async sendRequestWithRetry(method: string, url: string, retryCount = 0): Promise<ApiResponse> {
    try {
      // Track request for rate limiting
      this.requestCount++
      this.lastRequestTime = Date.now()

      const response = await fetch(url, { method })
      const responseText = await response.text()

      logger.info(`API response status: ${response.status}`)

      if (!response.ok) {
        logger.error(`API request failed. Status: ${response.status}`, responseText)

        try {
          const errorJson = JSON.parse(responseText)
          const errorCode = errorJson.error?.code
          const errorMessage = errorJson.error?.message || `API Error (${response.status})`

          // Check if this is a rate limit error
          if (RATE_LIMIT_CODES.includes(errorCode) && retryCount < MAX_RETRIES) {
            const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "5", 10)
            logger.warn(`Rate limit hit. Retrying after ${retryAfter} seconds. Retry ${retryCount + 1}/${MAX_RETRIES}`)

            // Wait for the specified time before retrying
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000 || RETRY_DELAY_MS))

            // Retry the request
            return this.sendRequestWithRetry(method, url, retryCount + 1)
          }

          // If we've exhausted retries or it's not a rate limit error
          return {
            success: false,
            error: errorMessage,
            details: errorJson,
            rateLimited: RATE_LIMIT_CODES.includes(errorCode),
          }
        } catch (e) {
          // If JSON parsing fails, use the raw response text
          return {
            success: false,
            error: `API Error (${response.status}): ${responseText}`,
            details: { rawResponse: responseText },
          }
        }
      }

      // Parse successful response
      try {
        const data = JSON.parse(responseText)
        return {
          success: true,
          data,
        }
      } catch (parseError) {
        logger.error("Failed to parse API response:", parseError, responseText)
        return {
          success: false,
          error: `Invalid JSON response: ${responseText}`,
          details: { parseError, rawResponse: responseText },
        }
      }
    } catch (error) {
      logger.error(`API request failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during API request",
        details: error,
      }
    }
  }

  /**
   * Apply rate limiting to avoid hitting Instagram API limits
   */
  private async applyRateLimit(): Promise<void> {
    // Simple rate limiting: max 10 requests per minute
    const MAX_REQUESTS_PER_MINUTE = 10
    const MIN_REQUEST_INTERVAL_MS = 6000 // 6 seconds between requests

    if (this.requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const elapsedSinceFirstRequest = Date.now() - this.lastRequestTime

      if (elapsedSinceFirstRequest < 60000) {
        // Less than a minute
        const waitTime = 60000 - elapsedSinceFirstRequest
        logger.warn(`Rate limit approaching. Waiting ${waitTime}ms before next request`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        this.requestCount = 0
      } else {
        // Reset counter if more than a minute has passed
        this.requestCount = 0
      }
    } else if (this.lastRequestTime > 0) {
      // Ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
        const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest
        logger.info(`Spacing requests. Waiting ${waitTime}ms before next request`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  /**
   * Validate the access token
   */
  async validateToken(): Promise<boolean> {
    try {
      logger.info("Validating Instagram access token")
      const url = `${GRAPH_API_URL}/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`

      // Apply rate limiting
      await this.applyRateLimit()

      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`Token validation failed with status ${response.status}: ${errorText}`)
        return false
      }

      const data = await response.json()
      logger.info("Token validation response:", data)

      // Check if the token is valid and not expired
      if (data.data && data.data.is_valid) {
        // Check expiration (if available)
        if (data.data.expires_at && data.data.expires_at < Math.floor(Date.now() / 1000)) {
          logger.warn("Token expired")
          return false
        }
        logger.info("Token is valid")
        return true
      }

      logger.warn("Token is invalid:", data.data?.error?.message || "No error message provided")
      return false
    } catch (error) {
      logger.error("Error validating token:", error)
      return false
    }
  }

  /**
   * Create a media container for an image
   */
  async createMediaContainer(imageUrl: string, caption: string): Promise<InstagramMediaContainer> {
    if (this.mockMode) {
      logger.info("[MOCK] Creating media container")
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay
      return { id: `mock_container_${Date.now()}` }
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.accountId}/media`

      const params = new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: this.accessToken,
      })

      logger.info(`Creating media container for account ${this.accountId}`)

      const response = await this.makeRequest(url, params)

      if (!response.id) {
        throw new Error("Failed to create media container: No container ID returned")
      }

      return { id: response.id }
    } catch (error) {
      logger.error("Error creating media container:", error)
      throw this.handleApiError(error, "Failed to create media container")
    }
  }

  /**
   * Publish a media container
   */
  async publishMediaContainer(containerId: string): Promise<InstagramPostResult> {
    if (this.mockMode) {
      logger.info("[MOCK] Publishing media container")
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay
      return {
        id: `mock_post_${Date.now()}`,
        status: "SUCCESS",
        permalink: "https://www.instagram.com/p/mock_post/",
      }
    }

    try {
      // Wait a bit to ensure the container is ready
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const url = `https://graph.facebook.com/v18.0/${this.accountId}/media_publish`

      const params = new URLSearchParams({
        creation_id: containerId,
        access_token: this.accessToken,
      })

      logger.info(`Publishing media container ${containerId} for account ${this.accountId}`)

      const response = await this.makeRequest(url, params)

      if (!response.id) {
        throw new Error("Failed to publish media: No post ID returned")
      }

      // Get the permalink
      const permalink = await this.getMediaPermalink(response.id)

      return {
        id: response.id,
        status: "SUCCESS",
        permalink,
      }
    } catch (error) {
      logger.error("Error publishing media container:", error)
      throw this.handleApiError(error, "Failed to publish media")
    }
  }

  /**
   * Get the permalink for a media post
   */
  async getMediaPermalink(mediaId: string): Promise<string> {
    if (this.mockMode) {
      return `https://www.instagram.com/p/mock_${mediaId}/`
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${mediaId}`

      const params = new URLSearchParams({
        fields: "permalink",
        access_token: this.accessToken,
      })

      const response = await this.makeRequest(url, params)

      return response.permalink || ""
    } catch (error) {
      logger.warn("Error getting media permalink:", error)
      return "" // Non-critical error, return empty string
    }
  }

  /**
   * Make a request to the Instagram API with retry logic
   */
  private async makeRequest(url: string, params: URLSearchParams, retryCount = 0): Promise<any> {
    try {
      const response = await fetch(`${url}?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        // Check for rate limiting
        if (this.isRateLimited(data) && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
          logger.warn(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

          await new Promise((resolve) => setTimeout(resolve, delay))
          return this.makeRequest(url, params, retryCount + 1)
        }

        throw data
      }

      return data
    } catch (error) {
      if (retryCount < MAX_RETRIES && this.shouldRetry(error)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
        logger.warn(`Request failed. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.makeRequest(url, params, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Check if an error is due to rate limiting
   */
  private isRateLimited(response: any): boolean {
    if (response?.error?.code && RATE_LIMIT_CODES.includes(response.error.code)) {
      return true
    }

    return false
  }

  /**
   * Determine if we should retry a request based on the error
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or certain API errors
    if (error instanceof TypeError || error instanceof Error) {
      return true
    }

    // Retry on certain API error codes (temporary issues)
    if (error?.error?.code) {
      const retriableErrorCodes = [1, 2, 4, 17, 341]
      return retriableErrorCodes.includes(error.error.code)
    }

    return false
  }

  /**
   * Handle API errors and provide more user-friendly messages
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    if (error?.error?.message) {
      const errorCode = error.error.code || "unknown"
      const errorType = error.error.type || "unknown"
      const errorMessage = error.error.message

      // Map common error codes to more user-friendly messages
      const errorMap: Record<number, string> = {
        4: "Instagram API rate limit exceeded. Please try again later.",
        10: "Invalid Instagram API permissions. Check your app permissions.",
        100: "Invalid parameter provided to Instagram API.",
        190: "Instagram access token is invalid or has expired.",
        200: "Instagram API permission denied.",
        613: "Limit on API calls per user per hour exceeded.",
      }

      const friendlyMessage = errorMap[errorCode] || errorMessage

      logger.error(`Instagram API Error (${errorCode}/${errorType}): ${errorMessage}`)
      return new Error(`${defaultMessage}: ${friendlyMessage}`)
    }

    return new Error(defaultMessage)
  }
}

/**
 * Get Instagram credentials from the database
 */
export async function getInstagramCredentials(): Promise<InstagramCredentials | null> {
  try {
    logger.info("Getting Instagram credentials from database")
    const supabase = createServerClient()

    // Get Instagram account settings
    const { data, error } = await supabase
      .from("instagram_settings")
      .select("connected, account_id, access_token")
      .eq("id", 1)
      .single()

    if (error) {
      logger.error("Error fetching Instagram credentials from database:", error)
      return null
    }

    logger.info("Instagram credentials retrieved:", {
      connected: data?.connected,
      hasAccountId: !!data?.account_id,
      hasAccessToken: !!data?.access_token,
    })

    if (!data || !data.connected || !data.access_token || !data.account_id) {
      logger.warn("Instagram credentials not found or incomplete:", {
        connected: data?.connected,
        hasAccessToken: !!data?.access_token,
        hasAccountId: !!data?.account_id,
      })
      return null
    }

    return {
      accessToken: data.access_token,
      accountId: data.account_id,
    }
  } catch (error) {
    logger.error("Error getting Instagram credentials:", error)
    return null
  }
}

/**
 * Create an Instagram API client
 */
export async function createInstagramClient(): Promise<InstagramApiClient | null> {
  logger.info("Creating Instagram API client")
  const credentials = await getInstagramCredentials()

  if (!credentials) {
    logger.warn("No Instagram credentials found or account not connected")
    return null
  }

  logger.info("Instagram credentials found, creating client")
  return new InstagramApiClient(credentials)
}

/**
 * Create a new Instagram API client
 */
export async function createInstagramApiClient(): Promise<InstagramApiClient> {
  try {
    // Get Instagram settings from the database
    const { createClient } = await import("@/lib/supabase/server")
    const { cookies } = await import("next/headers")

    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("instagram_settings").select("*").single()

    if (error || !data) {
      throw new Error("Instagram settings not found")
    }

    if (!data.connected || !data.access_token || !data.account_id) {
      throw new Error("Instagram account not connected")
    }

    const mockMode = process.env.USE_MOCK_INSTAGRAM === "true"

    return new InstagramApiClient(data.access_token, data.account_id, mockMode)
  } catch (error) {
    logger.error("Error creating Instagram API client:", error)
    throw error
  }
}

/**
 * Post an image to Instagram
 */
export async function postToInstagram(imageUrl: string, caption: string): Promise<InstagramPostResult> {
  try {
    const client = await createInstagramApiClient()

    // Create a media container
    const container = await client.createMediaContainer(imageUrl, caption)

    // Publish the media container
    return await client.publishMediaContainer(container.id)
  } catch (error) {
    logger.error("Error posting to Instagram:", error)
    return {
      id: "",
      status: "ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Schedule a post to Instagram
 */
export async function scheduleInstagramPost(
  imageUrl: string,
  caption: string,
  scheduledTime: Date,
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    // Get the database client
    const { createClient } = await import("@/lib/supabase/server")
    const { cookies } = await import("next/headers")

    const supabase = createClient(cookies())

    // Insert the scheduled post into the database
    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        image_url: imageUrl,
        caption: caption,
        scheduled_time: scheduledTime.toISOString(),
        status: "scheduled",
      })
      .select()

    if (error) {
      throw error
    }

    return {
      success: true,
      message: "Post scheduled successfully",
      id: data?.[0]?.id,
    }
  } catch (error) {
    logger.error("Error scheduling Instagram post:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to schedule post",
    }
  }
}

/**
 * Get the mock mode status
 */
export async function getMockModeStatus(): Promise<boolean> {
  return process.env.USE_MOCK_INSTAGRAM === "true"
}

/**
 * Set the mock mode status
 */
export async function setMockMode(enabled: boolean): Promise<void> {
  process.env.USE_MOCK_INSTAGRAM = enabled ? "true" : "false"
}

/**
 * Check if the Instagram API is available
 */
export async function checkInstagramApiAvailability(): Promise<{ available: boolean; message?: string }> {
  try {
    const response = await fetch("https://graph.facebook.com/v18.0/instagram_oembed")

    if (response.ok) {
      return { available: true }
    }

    const data = await response.json()
    return {
      available: false,
      message: data?.error?.message || "Instagram API is not available",
    }
  } catch (error) {
    return {
      available: false,
      message: "Could not connect to Instagram API",
    }
  }
}

/**
 * Get Instagram API status
 */
export async function getInstagramApiStatus(): Promise<{
  connected: boolean
  apiAvailable: boolean
  mockMode: boolean
  credentials: {
    appId: boolean
    appSecret: boolean
  }
}> {
  const mockMode = process.env.USE_MOCK_INSTAGRAM === "true"
  const apiAvailable = mockMode || (await checkInstagramApiAvailability()).available

  return {
    connected: false, // Will be updated with actual data
    apiAvailable,
    mockMode,
    credentials: {
      appId: !!process.env.INSTAGRAM_APP_ID,
      appSecret: !!process.env.INSTAGRAM_APP_SECRET,
    },
  }
}

/**
 * Create a mock Instagram API client for testing
 */
export function createMockInstagramApiClient(): InstagramApiClient {
  return new InstagramApiClient("mock_token", "mock_account_id", true)
}

/**
 * Get Instagram app credentials from the database
 */
export async function getInstagramAppCredentials(): Promise<{ appId: string; appSecret: string } | null> {
  try {
    logger.info("Getting Instagram app credentials from database")
    const supabase = createServerClient()

    // Get App ID
    const { data: appIdData, error: appIdError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "instagram_app_id")
      .single()

    if (appIdError || !appIdData?.value) {
      logger.error("Instagram App ID not found in database", appIdError)
      return null
    }

    // Get App Secret
    const { data: appSecretData, error: appSecretError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "instagram_app_secret")
      .single()

    if (appSecretError || !appSecretData?.value) {
      logger.error("Instagram App Secret not found in database", appSecretError)
      return null
    }

    return {
      appId: appIdData.value,
      appSecret: appSecretData.value,
    }
  } catch (error) {
    logger.error("Error getting Instagram app credentials:", error)
    return null
  }
}

export default InstagramApiClient

