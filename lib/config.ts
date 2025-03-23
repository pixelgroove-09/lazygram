// Configuration settings for the application

// Instagram connection settings
export const instagramConfig = {
  // API version for Instagram Graph API
  apiVersion: "v18.0",

  // Timeout for Instagram API requests (in milliseconds)
  apiTimeout: 10000,
}

// Helper function to always return false for mock mode
// This ensures backward compatibility with any code still checking this function
export function isMockModeEnabled(): boolean {
  return false
}

