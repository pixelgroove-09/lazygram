// Configuration settings for the application

// Instagram connection settings
export const instagramConfig = {
  // Set to false to use real Instagram API instead of mock
  // Default to true if environment variable is not set
  useMockMode: process.env.USE_MOCK_INSTAGRAM !== "false",

  // API version for Instagram Graph API
  apiVersion: "v18.0",

  // Timeout for Instagram API requests (in milliseconds)
  apiTimeout: 10000,
}

// Helper function to determine if mock mode is enabled
// This is safe to use in both client and server components
export function isMockModeEnabled(): boolean {
  // For server components, read directly from env
  if (typeof window === "undefined") {
    return process.env.USE_MOCK_INSTAGRAM !== "false"
  }

  // For client components, use the config object
  return instagramConfig.useMockMode
}

