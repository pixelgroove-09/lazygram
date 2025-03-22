// Enhanced mock implementation of Instagram API for development and testing

interface InstagramAccount {
  id: string
  username: string
  profilePicture?: string
}

// Mock function to simulate Instagram authentication
export async function mockInstagramAuth(): Promise<{
  success: boolean
  account?: InstagramAccount
  error?: string
}> {
  // Simulate a successful authentication
  return {
    success: true,
    account: {
      id: "mock_instagram_123456",
      username: "mock_instagram_user",
      profilePicture: "https://via.placeholder.com/150",
    },
  }
}

// Mock function to simulate posting to Instagram
export async function mockPostToInstagram(
  imageUrl: string,
  caption: string,
): Promise<{
  success: boolean
  postId?: string
  error?: string
}> {
  console.log("Mock posting to Instagram:")
  console.log("Image URL:", imageUrl)
  console.log("Caption:", caption)

  // Add a small delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Validate inputs
  if (!imageUrl) {
    return {
      success: false,
      error: "Image URL is required",
    }
  }

  if (!caption) {
    return {
      success: false,
      error: "Caption is required",
    }
  }

  // Simulate a successful post
  return {
    success: true,
    postId: "mock_post_" + Math.random().toString(36).substring(2, 10),
  }
}

// Mock function to simulate getting Instagram post status
export async function mockGetPostStatus(postId: string): Promise<{
  success: boolean
  status?: "PUBLISHED" | "IN_PROGRESS" | "ERROR"
  error?: string
}> {
  console.log("Mock getting post status for:", postId)

  // Add a small delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Validate inputs
  if (!postId) {
    return {
      success: false,
      error: "Post ID is required",
    }
  }

  // Simulate a successful status check
  return {
    success: true,
    status: "PUBLISHED",
  }
}

