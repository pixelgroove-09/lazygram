// Mock implementation of Instagram API for development and testing

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
      username: "your_business_account",
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

  // Simulate a successful post
  return {
    success: true,
    postId: "mock_post_" + Math.random().toString(36).substring(2, 10),
  }
}

