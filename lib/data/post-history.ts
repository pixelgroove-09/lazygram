import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { logger } from "../logger"

export interface PostHistory {
  id: string
  post_id: string | null
  caption: string
  image_url: string
  status: string
  posted_at: string | null
  permalink: string | null
  engagement: any | null
  created_at: string
}

export interface PostHistoryInput {
  post_id?: string | null
  caption: string
  image_url: string
  status: string
  posted_at?: string | null
  permalink?: string | null
  engagement?: any | null
}

/**
 * Get all post history
 */
export async function getPostHistory(): Promise<PostHistory[]> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("posts_history").select("*").order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching post history:", error)
      throw new Error(`Failed to fetch post history: ${error.message}`)
    }

    return data as PostHistory[]
  } catch (error) {
    logger.error("Error in getPostHistory:", error)
    throw error
  }
}

/**
 * Get post history by ID
 */
export async function getPostHistoryById(id: string): Promise<PostHistory | null> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("posts_history").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found, return null
        return null
      }

      logger.error("Error fetching post history:", error)
      throw new Error(`Failed to fetch post history: ${error.message}`)
    }

    return data as PostHistory
  } catch (error) {
    logger.error("Error in getPostHistoryById:", error)
    throw error
  }
}

/**
 * Create a post history entry
 */
export async function createPostHistory(post: PostHistoryInput): Promise<PostHistory> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase
      .from("posts_history")
      .insert({
        post_id: post.post_id || null,
        caption: post.caption,
        image_url: post.image_url,
        status: post.status,
        posted_at: post.posted_at || null,
        permalink: post.permalink || null,
        engagement: post.engagement || null,
      })
      .select()
      .single()

    if (error) {
      logger.error("Error creating post history:", error)
      throw new Error(`Failed to create post history: ${error.message}`)
    }

    return data as PostHistory
  } catch (error) {
    logger.error("Error in createPostHistory:", error)
    throw error
  }
}

/**
 * Update a post history entry
 */
export async function updatePostHistory(id: string, post: Partial<PostHistoryInput>): Promise<PostHistory> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("posts_history").update(post).eq("id", id).select().single()

    if (error) {
      logger.error("Error updating post history:", error)
      throw new Error(`Failed to update post history: ${error.message}`)
    }

    return data as PostHistory
  } catch (error) {
    logger.error("Error in updatePostHistory:", error)
    throw error
  }
}

/**
 * Delete a post history entry
 */
export async function deletePostHistory(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies())

    const { error } = await supabase.from("posts_history").delete().eq("id", id)

    if (error) {
      logger.error("Error deleting post history:", error)
      throw new Error(`Failed to delete post history: ${error.message}`)
    }
  } catch (error) {
    logger.error("Error in deletePostHistory:", error)
    throw error
  }
}

/**
 * Add a post to history
 */
export async function addPostToHistory(
  caption: string,
  imageUrl: string,
  status: string,
  details?: {
    post_id?: string
    permalink?: string
    posted_at?: string
    engagement?: any
  },
): Promise<PostHistory> {
  try {
    const post: PostHistoryInput = {
      caption,
      image_url: imageUrl,
      status,
    }

    if (details) {
      if (details.post_id) {
        post.post_id = details.post_id
      }

      if (details.permalink) {
        post.permalink = details.permalink
      }

      if (details.posted_at) {
        post.posted_at = details.posted_at
      } else if (status === "posted") {
        post.posted_at = new Date().toISOString()
      }

      if (details.engagement) {
        post.engagement = details.engagement
      }
    }

    return await createPostHistory(post)
  } catch (error) {
    logger.error("Error in addPostToHistory:", error)
    throw error
  }
}

/**
 * Update post engagement
 */
export async function updatePostEngagement(id: string, engagement: any): Promise<PostHistory> {
  try {
    return await updatePostHistory(id, { engagement })
  } catch (error) {
    logger.error("Error in updatePostEngagement:", error)
    throw error
  }
}

