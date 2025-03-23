import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { logger } from "../logger"

export interface ScheduledPost {
  id: string
  image_url: string
  caption: string
  scheduled_time: string
  status: "scheduled" | "processing" | "posted" | "failed"
  error?: string | null
  post_id?: string | null
  permalink?: string | null
  posted_at?: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledPostInput {
  image_url: string
  caption: string
  scheduled_time: string
  status?: "scheduled" | "processing" | "posted" | "failed"
  error?: string | null
  post_id?: string | null
  permalink?: string | null
  posted_at?: string | null
}

/**
 * Get all scheduled posts
 */
export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_time", { ascending: true })

    if (error) {
      logger.error("Error fetching scheduled posts:", error)
      throw new Error(`Failed to fetch scheduled posts: ${error.message}`)
    }

    return data as ScheduledPost[]
  } catch (error) {
    logger.error("Error in getScheduledPosts:", error)
    throw error
  }
}

/**
 * Get scheduled posts by status
 */
export async function getScheduledPostsByStatus(
  status: "scheduled" | "processing" | "posted" | "failed",
): Promise<ScheduledPost[]> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", status)
      .order("scheduled_time", { ascending: true })

    if (error) {
      logger.error(`Error fetching ${status} posts:`, error)
      throw new Error(`Failed to fetch ${status} posts: ${error.message}`)
    }

    return data as ScheduledPost[]
  } catch (error) {
    logger.error(`Error in getScheduledPostsByStatus(${status}):`, error)
    throw error
  }
}

/**
 * Get a scheduled post by ID
 */
export async function getScheduledPostById(id: string): Promise<ScheduledPost | null> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase.from("scheduled_posts").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found, return null
        return null
      }

      logger.error("Error fetching scheduled post:", error)
      throw new Error(`Failed to fetch scheduled post: ${error.message}`)
    }

    return data as ScheduledPost
  } catch (error) {
    logger.error("Error in getScheduledPostById:", error)
    throw error
  }
}

/**
 * Create a scheduled post
 */
export async function createScheduledPost(post: ScheduledPostInput): Promise<ScheduledPost> {
  try {
    const supabase = createClient(cookies())

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        image_url: post.image_url,
        caption: post.caption,
        scheduled_time: post.scheduled_time,
        status: post.status || "scheduled",
        error: post.error || null,
        post_id: post.post_id || null,
        permalink: post.permalink || null,
        posted_at: post.posted_at || null,
      })
      .select()
      .single()

    if (error) {
      logger.error("Error creating scheduled post:", error)
      throw new Error(`Failed to create scheduled post: ${error.message}`)
    }

    return data as ScheduledPost
  } catch (error) {
    logger.error("Error in createScheduledPost:", error)
    throw error
  }
}

/**
 * Update a scheduled post
 */
export async function updateScheduledPost(id: string, post: Partial<ScheduledPostInput>): Promise<ScheduledPost> {
  try {
    const supabase = createClient(cookies())

    const updateData = {
      ...post,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("scheduled_posts").update(updateData).eq("id", id).select().single()

    if (error) {
      logger.error("Error updating scheduled post:", error)
      throw new Error(`Failed to update scheduled post: ${error.message}`)
    }

    return data as ScheduledPost
  } catch (error) {
    logger.error("Error in updateScheduledPost:", error)
    throw error
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies())

    const { error } = await supabase.from("scheduled_posts").delete().eq("id", id)

    if (error) {
      logger.error("Error deleting scheduled post:", error)
      throw new Error(`Failed to delete scheduled post: ${error.message}`)
    }
  } catch (error) {
    logger.error("Error in deleteScheduledPost:", error)
    throw error
  }
}

/**
 * Get due scheduled posts
 */
export async function getDueScheduledPosts(): Promise<ScheduledPost[]> {
  try {
    const supabase = createClient(cookies())

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_time", now)
      .order("scheduled_time", { ascending: true })

    if (error) {
      logger.error("Error fetching due scheduled posts:", error)
      throw new Error(`Failed to fetch due scheduled posts: ${error.message}`)
    }

    return data as ScheduledPost[]
  } catch (error) {
    logger.error("Error in getDueScheduledPosts:", error)
    throw error
  }
}

/**
 * Update post status
 */
export async function updatePostStatus(
  id: string,
  status: "scheduled" | "processing" | "posted" | "failed",
  details?: {
    error?: string
    post_id?: string
    permalink?: string
    posted_at?: string
  },
): Promise<ScheduledPost> {
  try {
    const updateData: Partial<ScheduledPostInput> = {
      status,
    }

    if (details) {
      if (details.error !== undefined) {
        updateData.error = details.error
      }

      if (details.post_id !== undefined) {
        updateData.post_id = details.post_id
      }

      if (details.permalink !== undefined) {
        updateData.permalink = details.permalink
      }

      if (details.posted_at !== undefined) {
        updateData.posted_at = details.posted_at
      } else if (status === "posted") {
        updateData.posted_at = new Date().toISOString()
      }
    }

    return await updateScheduledPost(id, updateData)
  } catch (error) {
    logger.error("Error in updatePostStatus:", error)
    throw error
  }
}

