"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, ImagePlus, X, AlertCircle, Save, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { analyzeAndSaveImage, scheduleImage } from "@/app/actions/image-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSavedPrompts, savePrompt, deletePrompt } from "@/app/actions/prompt-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { calculateNextAvailableSlots } from "@/lib/schedule-utils"
import { useGallery } from "@/contexts/gallery-context"

interface SavedPrompt {
  id: string
  name: string
  prompt: string
  createdAt: string
}

export default function UploadForm() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [prompt, setPrompt] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({})
  const [dragActive, setDragActive] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [savePromptDialogOpen, setSavePromptDialogOpen] = useState(false)
  const [promptName, setPromptName] = useState("")
  const [loadingSavedPrompts, setLoadingSavedPrompts] = useState(true)
  const [autoSchedule, setAutoSchedule] = useState(true)

  const { refreshGallery } = useGallery()

  useEffect(() => {
    loadSavedPrompts()
  }, [])

  const loadSavedPrompts = async () => {
    try {
      setLoadingSavedPrompts(true)
      const prompts = await getSavedPrompts()
      setSavedPrompts(prompts)
    } catch (error) {
      console.error("Failed to load saved prompts:", error)
      toast({
        title: "Error loading saved prompts",
        description: "Could not load your saved prompts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingSavedPrompts(false)
    }
  }

  const handleSavePrompt = async () => {
    try {
      if (!promptName.trim()) {
        toast({
          title: "Name required",
          description: "Please provide a name for your prompt.",
          variant: "destructive",
        })
        return
      }

      if (!prompt.trim()) {
        toast({
          title: "Prompt required",
          description: "Please provide a prompt to save.",
          variant: "destructive",
        })
        return
      }

      await savePrompt(promptName, prompt)
      await loadSavedPrompts()

      setSavePromptDialogOpen(false)
      setPromptName("")

      toast({
        title: "Prompt saved",
        description: "Your prompt has been saved for future use.",
      })
    } catch (error) {
      console.error("Failed to save prompt:", error)
      toast({
        title: "Save failed",
        description: "Could not save your prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt(id)
      await loadSavedPrompts()

      toast({
        title: "Prompt deleted",
        description: "Your saved prompt has been deleted.",
      })
    } catch (error) {
      console.error("Failed to delete prompt:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete your prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSelectPrompt = (selectedPrompt: SavedPrompt) => {
    setPrompt(selectedPrompt.prompt)
    toast({
      title: "Prompt selected",
      description: `"${selectedPrompt.name}" has been loaded.`,
    })
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((files) => files.filter((_, i) => i !== index))
  }, [])

  const uploadFile = async (file: File, index: number) => {
    try {
      // Update status
      setUploadStatus((prev) => ({
        ...prev,
        [index]: "Uploading to Vercel Blob...",
      }))

      // Create form data for this specific file
      const formData = new FormData()
      formData.append("file", file)

      // Upload to Vercel Blob
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Update progress and status
      setUploadProgress((prev) => ({
        ...prev,
        [index]: 50,
      }))
      setUploadStatus((prev) => ({
        ...prev,
        [index]: "Generating captions...",
      }))

      // Now analyze the image with Claude and save to DB
      await analyzeAndSaveImage({
        id: result.id,
        url: result.url,
        prompt,
      })

      // Update progress to 100%
      setUploadProgress((prev) => ({
        ...prev,
        [index]: 100,
      }))
      setUploadStatus((prev) => ({
        ...prev,
        [index]: "Complete!",
      }))

      return result
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error)
      setUploadStatus((prev) => ({
        ...prev,
        [index]: "Failed",
      }))
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "No prompt provided",
        description: "Please provide a thematic prompt for caption generation.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    // Initialize progress for each file
    const initialProgress = files.reduce(
      (acc, _, index) => {
        acc[index] = 0
        return acc
      },
      {} as { [key: string]: number },
    )

    const initialStatus = files.reduce(
      (acc, _, index) => {
        acc[index] = "Preparing..."
        return acc
      },
      {} as { [key: string]: string },
    )

    setUploadProgress(initialProgress)
    setUploadStatus(initialStatus)

    try {
      // Array to store upload results
      const uploadResults = []

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        // Set progress to 10% to indicate upload started
        setUploadProgress((prev) => ({
          ...prev,
          [i]: 10,
        }))

        const result = await uploadFile(files[i], i)
        uploadResults.push(result)
      }

      // Auto-schedule the uploaded images if enabled
      if (autoSchedule && uploadResults.length > 0) {
        setUploadStatus((prev) => {
          const newStatus = { ...prev }
          Object.keys(newStatus).forEach((key) => {
            newStatus[key] = "Scheduling..."
          })
          return newStatus
        })

        try {
          const slots = await calculateNextAvailableSlots(uploadResults.length)

          for (let i = 0; i < uploadResults.length; i++) {
            await scheduleImage(uploadResults[i].id, slots[i].toISOString())
          }

          toast({
            title: "Images scheduled",
            description: `${uploadResults.length} images have been automatically scheduled for posting.`,
          })
        } catch (scheduleError) {
          console.error("Error scheduling images:", scheduleError)
          toast({
            title: "Scheduling failed",
            description: "Images were uploaded but could not be scheduled automatically.",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Upload successful",
        description: `${files.length} images uploaded and processed.`,
      })

      setFiles([])
      refreshGallery() // Refresh the gallery
      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Images</CardTitle>
        <CardDescription>Upload multiple images to generate captions with AI</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thematic Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt" className="text-sm font-medium">
                Thematic Prompt
              </Label>

              <div className="flex items-center space-x-2">
                <Dialog open={savePromptDialogOpen} onOpenChange={setSavePromptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!prompt.trim() || uploading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Prompt
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Prompt</DialogTitle>
                      <DialogDescription>Give your prompt a name so you can reuse it later.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="prompt-name">Prompt Name</Label>
                        <Input
                          id="prompt-name"
                          placeholder="e.g., Professional Business, Travel Adventure"
                          value={promptName}
                          onChange={(e) => setPromptName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prompt-preview">Prompt</Label>
                        <Textarea id="prompt-preview" value={prompt} readOnly className="min-h-[100px] bg-muted" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSavePromptDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSavePrompt}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={savedPrompts.length === 0 || uploading}>
                      Saved Prompts
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[300px]">
                    <DropdownMenuLabel>Select a Saved Prompt</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loadingSavedPrompts ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Loading saved prompts...</div>
                    ) : savedPrompts.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">No saved prompts yet</div>
                    ) : (
                      savedPrompts.map((savedPrompt) => (
                        <DropdownMenuItem key={savedPrompt.id} className="flex justify-between items-center">
                          <div className="flex-1 cursor-pointer" onClick={() => handleSelectPrompt(savedPrompt)}>
                            <span className="font-medium">{savedPrompt.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePrompt(savedPrompt.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Textarea
              id="prompt"
              placeholder="Describe the theme or style for your captions (e.g., 'Professional business content with motivational quotes' or 'Casual travel photos with fun facts')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={uploading}
            />
          </div>

          {/* Auto-schedule option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-schedule"
              checked={autoSchedule}
              onCheckedChange={(checked) => setAutoSchedule(checked as boolean)}
            />
            <Label htmlFor="auto-schedule" className="text-sm font-medium cursor-pointer">
              Auto-schedule posts based on your frequency settings
            </Label>
          </div>

          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <ImagePlus className="h-10 w-10 text-muted-foreground" />
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">Drag images here or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports: JPG, PNG, WEBP, HEIC</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={uploading}
              >
                Browse Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Selected Images ({files.length})</p>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {uploading && typeof uploadProgress[index] !== "undefined" && (
                        <>
                          <Progress value={uploadProgress[index]} className="h-1 mt-2" />
                          <p className="text-xs text-muted-foreground mt-1">{uploadStatus[index]}</p>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              The AI will analyze each image and generate a unique caption based on the content and your thematic
              prompt.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          className="w-full"
          disabled={uploading || files.length === 0 || !prompt.trim()}
          onClick={handleSubmit}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading and Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload and Generate Captions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

