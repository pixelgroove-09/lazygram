import { v4 as uuidv4 } from "uuid"
import { logger } from "./logger"

// Types of requests to log
const INSTAGRAM_API_PATTERNS = [
  { pattern: /graph\.facebook\.com\/v\d+\/oauth\/access_token/, type: "token" },
  { pattern: /graph\.facebook\.com\/v\d+\/me\/accounts/, type: "account" },
  { pattern: /graph\.facebook\.com\/v\d+\/.*instagram_business_account/, type: "account" },
  { pattern: /facebook\.com\/v\d+\/dialog\/oauth/, type: "auth" },
  { pattern: /graph\.facebook\.com\/v\d+\/debug_token/, type: "token" },
]

// Function to determine if a URL should be logged
function shouldLogRequest(url: string): { shouldLog: boolean; type: string } {
  for (const { pattern, type } of INSTAGRAM_API_PATTERNS) {
    if (pattern.test(url)) {
      return { shouldLog: true, type }
    }
  }
  return { shouldLog: false, type: "other" }
}

// Function to sanitize request/response data
function sanitizeData(data: any): any {
  if (!data) return data

  // Clone the data to avoid modifying the original
  let sanitized: any

  try {
    sanitized = JSON.parse(JSON.stringify(data))
  } catch (e) {
    return data
  }

  // Sanitize sensitive fields
  if (typeof sanitized === "object") {
    // Redact sensitive values
    if (sanitized.access_token) sanitized.access_token = "[REDACTED]"
    if (sanitized.client_secret) sanitized.client_secret = "[REDACTED]"
    if (sanitized.fb_exchange_token) sanitized.fb_exchange_token = "[REDACTED]"

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key])
      }
    })
  }

  return sanitized
}

// Function to log a request to the database
async function logRequestToDatabase(logData: any) {
  try {
    // Use the original fetch to avoid infinite recursion
    const originalFetch = window.fetch
    const response = await originalFetch("/api/diagnostic/instagram-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    })

    if (!response.ok) {
      logger.error("Failed to log Instagram request:", await response.text())
    }
  } catch (error) {
    logger.error("Error logging Instagram request:", error)
  }
}

// Initialize the Instagram request logger
export function initInstagramRequestLogger() {
  // Only run in browser environment
  if (typeof window === "undefined") {
    return false
  }

  // Store the original fetch function
  const originalFetch = window.fetch

  // Override the fetch function to intercept requests
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.url
    const { shouldLog, type } = shouldLogRequest(url)

    // If this is not an Instagram API request, use the original fetch
    if (!shouldLog) {
      return originalFetch(input, init)
    }

    // Prepare log data
    const logData: any = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      url,
      method: init?.method || "GET",
      headers: init?.headers || {},
    }

    // Log request body if present
    if (init?.body) {
      try {
        // Try to parse JSON body
        if (typeof init.body === "string") {
          try {
            logData.body = JSON.parse(init.body)
          } catch {
            // If not JSON, try to parse URL encoded params
            if (init.body.includes("=")) {
              const params: Record<string, string> = {}
              init.body.split("&").forEach((param) => {
                const [key, value] = param.split("=")
                if (key && value) {
                  params[key] = decodeURIComponent(value)
                }
              })
              logData.body = params
            } else {
              logData.body = init.body
            }
          }
        } else if (init.body instanceof FormData) {
          // Convert FormData to object
          const formDataObj: Record<string, any> = {}
          for (const [key, value] of (init.body as FormData).entries()) {
            formDataObj[key] = value
          }
          logData.body = formDataObj
        } else {
          logData.body = String(init.body)
        }
      } catch (error) {
        logger.error("Error parsing request body for logging:", error)
        logData.body = "[Error parsing body]"
      }
    }

    // Make the actual request
    try {
      const response = await originalFetch(input, init)

      // Clone the response so we can read the body
      const clonedResponse = response.clone()

      // Log response data
      logData.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      }

      // Try to parse response body
      try {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          logData.response.body = await clonedResponse.json()
        } else {
          const text = await clonedResponse.text()
          // Try to parse as JSON anyway
          try {
            logData.response.body = JSON.parse(text)
          } catch {
            logData.response.body = text.substring(0, 1000) // Limit text size
          }
        }
      } catch (error) {
        logger.error("Error parsing response body for logging:", error)
        logData.response.body = "[Error parsing body]"
      }

      // Log the request asynchronously
      logRequestToDatabase(sanitizeData(logData))

      return response
    } catch (error) {
      // Log error
      logData.error = error instanceof Error ? error.message : String(error)

      // Log the failed request asynchronously
      logRequestToDatabase(sanitizeData(logData))

      // Re-throw the error
      throw error
    }
  }

  logger.info("Instagram request logger initialized")
  return true
}

