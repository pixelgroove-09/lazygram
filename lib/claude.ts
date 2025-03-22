interface ImageAnalysis {
  caption: string
  hashtags: string[]
}

export async function analyzeImageWithClaude(imageUrl: string, prompt: string): Promise<ImageAnalysis> {
  try {
    console.log("Analyzing image with Claude API:", imageUrl)
    
    // 1. Download the image data
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    
    // 2. Create the prompt for Claude using the template
    const claudePrompt = `You are an expert Instagram content creator who crafts short, engaging captions that feel authentic and capture attention.

Analyze the image and create:
1. A concise caption (30-60 words max) that:
   * Has a casual, conversational tone
   * Includes 1-2 fitting emojis naturally placed within the text
   * Captures the mood/essence rather than describing the image in detail
   * Ends with an engaging question or statement
   * Avoids being overly descriptive or academic in tone

2. 4-5 relevant hashtags (no more) that will boost discovery

[USER THEME PREFERENCES: ${prompt}]

Examples of good captions:
- "Paradise from above ✨ Where Bali's emerald waters kiss the shore and umbrellas dot the sand like blooming flowers. Hidden beach gems like this are what make the Island of Gods truly magical. #BaliLife #IslandParadise #DroneViews #HiddenBeaches #ExploreBali"

- "Embracing the mist and each other 🌿 Nature's most precious bond captured in the wild. #MonkeyLove #WildlifeWonders #MistyMornings #MotherNature"

Respond with:
1. The Instagram caption (30-60 words max)
2. Recommended hashtags (4-5 only)`

    // 3. Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: claudePrompt
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    })
    const result = await response.json()
    
    // 4. Parse Claude's response
    // This assumes Claude responds in a structured format with caption and hashtags
    const content = result.content[0].text
    
    // Simple parsing approach - assumes Claude returns caption followed by hashtags
    const sections = content.split(/Recommended hashtags:|Hashtags:/i)
    let caption = ''
    let hashtags: string[] = []
    
    if (sections.length >= 2) {
      caption = sections[0].trim()
      // Extract hashtags, assuming they're listed with # symbols
      const hashtagText = sections[1].trim()
      hashtags = hashtagText.match(/#\w+/g) || []
    } else {
      // Fallback parsing if Claude doesn't follow the exact format
      caption = content.replace(/#\w+/g, '').trim()
      const hashtagMatches = content.match(/#\w+/g)
      hashtags = hashtagMatches || []
    }
    return {
      caption,
      hashtags
    }
  } catch (error) {
    console.error("Error analyzing image with Claude:", error)
    // Fallback response if the API call fails
    return {
      caption: "Capturing moments that matter.",
      hashtags: ["#photography", "#moments", "#instagram", "#content", "#lifestyle"],
    }
  }
}

