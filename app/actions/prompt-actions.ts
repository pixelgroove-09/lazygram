"use server"

import { getSavedPromptsFromDB, savePromptToDB, deletePromptFromDB } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

export async function getSavedPrompts() {
  try {
    const prompts = await getSavedPromptsFromDB()
    return prompts
  } catch (error) {
    console.error("Error fetching saved prompts:", error)
    throw new Error("Failed to fetch saved prompts")
  }
}

export async function savePrompt(name: string, promptText: string) {
  try {
    if (!name.trim() || !promptText.trim()) {
      throw new Error("Prompt name and text are required")
    }

    const prompt = {
      id: uuidv4(),
      name: name.trim(),
      prompt: promptText.trim(),
      createdAt: new Date().toISOString(),
    }

    await savePromptToDB(prompt)
    revalidatePath("/")

    return { success: true, prompt }
  } catch (error) {
    console.error("Error saving prompt:", error)
    throw new Error("Failed to save prompt")
  }
}

export async function deletePrompt(id: string) {
  try {
    await deletePromptFromDB(id)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting prompt:", error)
    throw new Error("Failed to delete prompt")
  }
}

