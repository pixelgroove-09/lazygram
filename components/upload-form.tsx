"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, ImagePlus, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { analyzeAndSaveImage, scheduleImage } from "@/app/actions/image-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSavedPrompts } from "@/app/actions/prompt-actions"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [promptText, setPromptText] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>({})
  const [dragActive, setDragActive] = useState(false)
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
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

      // If there are prompts, select the first one by default
      if (prompts.length > 0) {
        setSelectedPromptId(prompts[0].id)
        setPromptText(prompts[0].prompt)
      }
    } catch (error) {
      console.error("Failed to load saved prompts:", error)
      toast({
        title: "Error loading prompts",
        description: "Could not load your saved prompts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingSavedPrompts(false)
    }
  }

  const handlePromptChange = (promptId: string) => {
    const selectedPrompt = savedPrompts.find((p) => p.id === promptId)
    if (selectedPrompt) {
      setSelectedPromptId(promptId)
      setPromptText(selectedPrompt.prompt)
    }
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
        prompt: promptText,
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

    if (!promptText) {
      toast({
        title: "No prompt selected",
        description: "Please select a thematic prompt for caption generation.",
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
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt Selection */}
          <div className="space-y-2 pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-select" className="text-sm font-medium">
                Select Thematic Prompt
              </Label>
              <Button variant="outline" size="sm" onClick={() => router.push("/settings?tab=prompts")} type="button">
                Manage Prompts
              </Button>
            </div>

            {loadingSavedPrompts ? (
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            ) : savedPrompts.length === 0 ? (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No prompts available</AlertTitle>
                <AlertDescription>
                  Please create a thematic prompt in Settings before uploading images.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedPromptId} onValueChange={handlePromptChange} disabled={uploading}>
                <SelectTrigger id="prompt-select">
                  <SelectValue placeholder="Select a thematic prompt" />
                </SelectTrigger>
                <SelectContent>
                  {savedPrompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Auto-schedule option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-schedule"
              checked={autoSchedule}
              onCheckedChange={(checked) => setAutoSchedule(checked as boolean)}
              disabled={uploading}
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
          disabled={uploading || files.length === 0 || !promptText || savedPrompts.length === 0}
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

