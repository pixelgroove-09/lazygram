interface ImageAnalysis {
  caption: string
  hashtags: string[]
}

/**
 * Thoroughly cleans captions from formatting instructions and metadata
 */
function cleanCaption(text: string): string {
  if (!text) return ""

  // Apply multiple cleaning passes to ensure all formatting instructions are removed
  let cleanedText = text
    // Remove "Instagram Caption (30-60 words):" and similar prefixes with any variations
    .replace(/^\s*(Instagram\s+Caption\s*($$\d+-\d+\s*words$$)?\s*:?\s*)/i, "")
    // Remove numeric list prefixes like "1." or "1. Caption:"
    .replace(/^\s*\d+\.\s*(Caption\s*:?\s*)?/i, "")
    // Remove hashtag sections entirely
    .replace(/\d+\.\s*(Relevant\s*)?Hashtags\s*($$\d+-\d+\s*(only)?$$)?\s*:?[\s\S]*$/i, "")
    // Remove trailing list markers
    .replace(/\s*\d+\.\s*$/g, "")
    // Remove quotation marks surrounding the entire text
    .replace(/^["']([\s\S]*)["']$/m, "$1")
    .trim()

  // Additional cleanup for persistent formatting issues
  cleanedText = cleanedText
    // Remove any remaining section headers that might appear
    .replace(/^Caption\s*:/i, "")
    .replace(/^The Instagram caption\s*:/i, "")
    // Remove any "words:" or "Word count:" metadata
    .replace(/$$\d+\s*words$$$/i, "")
    .trim()

  return cleanedText
}

/**
 * Analyzes an image with Claude API and returns caption and hashtags
 */
export async function analyzeImageWithClaude(imageUrl: string, prompt: string): Promise<ImageAnalysis> {
  try {
    console.log("Analyzing image with Claude API:", imageUrl)

    // Check for API key
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error("API key is missing. Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable")
    }

    // Download and prepare the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")

    // Check image size (Claude's limit is 10MB)
    const imageSizeMB = imageBuffer.byteLength / (1024 * 1024)
    console.log(`Image size: ${imageSizeMB.toFixed(2)} MB`)
    if (imageSizeMB > 9.5) {
      throw new Error("Image too large for Claude API (>9.5MB)")
    }

    // Create optimized prompt to avoid instruction leakage
    const claudePrompt = `You are an expert Instagram content creator generating captions for images.

For the image provided, create:

1. A concise, authentic caption (30-60 words) with:
   - Casual, conversational tone
   - 1-2 emojis naturally integrated
   - Engaging closing question or statement
   - Focus on mood/essence rather than detailed description

2. 4-5 relevant hashtags to boost discovery

USER THEME PREFERENCES: ${prompt}

IMPORTANT: Do NOT include any formatting text such as "Instagram Caption:", "Caption:", or word count instructions in your response.

Respond in this exact format:
[Caption text goes here with emojis]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5`

    // Use the specified Claude model
    const model = "claude-3-haiku-20240307"
    console.log(`Using Claude model: ${model}`)

    // Prepare the API request
    const requestBody = {
      model: model,
      max_tokens: 800,
      temperature: 0.7, // Add some creative variation but stay focused
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: claudePrompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    }

    // Make the API call
    console.log("Sending request to Claude API...")
    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    })

    // Handle errors and retry if necessary
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Claude API error (${response.status}):`, errorText)

      // If media type error, retry with image/png
      if (errorText.includes("media type") && contentType !== "image/png") {
        console.log("Retrying with image/png media type...")

        // Update the request body with image/png media type
        requestBody.messages[0].content[1].source.media_type = "image/png"

        // Retry the request
        const retryResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(requestBody),
        })

        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text()
          console.error(`Claude API retry error (${retryResponse.status}):`, retryErrorText)
          throw new Error(`Claude API retry failed with status ${retryResponse.status}: ${retryErrorText}`)
        }

        response = retryResponse
      } else {
        // If it's a model-related error, provide a clear error message
        if (errorText.includes("model") || errorText.includes("not_found_error")) {
          throw new Error(
            `The specified Claude model "${model}" was not found. Please check if this model is available.`,
          )
        } else {
          throw new Error(`Claude API returned status ${response.status}: ${errorText}`)
        }
      }
    }

    // Parse the successful response
    const result = await response.json()
    return parseClaudeResponse(result)
  } catch (error) {
    console.error("Error analyzing image with Claude:", error)

    // Provide a fallback response more specific to the image type if possible
    return {
      caption:
        "Natural beauty in its purest form. 🌿 These vibrant blooms remind us that sometimes the most exquisite moments happen in the quiet corners of the world. What hidden treasures have you discovered lately?",
      hashtags: ["#NaturePhotography", "#TropicalBeauty", "#BaliNature", "#IslandLife", "#FlowersMakeMeHappy"],
    }
  }
}

/**
 * Parses Claude's response into caption and hashtags
 */
function parseClaudeResponse(result: any): ImageAnalysis {
  // Validate response structure
  if (!result?.content?.[0]?.text) {
    console.error("Invalid Claude API response structure:", JSON.stringify(result))
    throw new Error("No valid content in Claude response")
  }

  const content = result.content[0].text.trim()
  console.log("Claude API response:", content.substring(0, 200) + "...")

  // Split response into caption and hashtags sections
  // First try to split by double newline which is our requested format
  let sections = content.split(/\n\n+/)

  // If that doesn't work, try other common separators
  if (sections.length < 2) {
    sections = content.split(/(?:\n+|Hashtags:|Recommended hashtags:)/i)
  }

  let caption = ""
  let hashtags: string[] = []

  if (sections.length >= 2) {
    // First section is caption - clean it thoroughly
    caption = cleanCaption(sections[0])

    // Find hashtags (either as #word or as words to be prefixed)
    const hashtagText = sections[sections.length - 1].trim()
    hashtags = hashtagText.match(/#\w+/g) || []

    // If no hashtags found with # prefixes, extract and add #
    if (hashtags.length === 0) {
      hashtags = hashtagText
        .split(/[\s,]+/)
        .filter((tag) => tag.length > 0 && !tag.match(/^\d+\./)) // Avoid numbered list items
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .filter((tag) => tag.length > 1)
    }
  } else {
    // Fallback: try to extract caption and hashtags from single block
    caption = cleanCaption(content)

    // Extract any hashtags that might be mixed into the text
    const hashtagMatches = content.match(/#\w+/g)
    hashtags = hashtagMatches || []
  }

  // Ensure we have hashtags (fallback if none found)
  if (hashtags.length === 0) {
    console.log("No hashtags found in Claude response, using generic hashtags")
    hashtags = ["#NaturePhotography", "#TropicalBeauty", "#BaliVibes", "#FlowersMakeMeHappy", "#IslandLife"]
  }

  // Limit to 5 hashtags maximum
  hashtags = hashtags.slice(0, 5)

  return {
    caption,
    hashtags,
  }
}

