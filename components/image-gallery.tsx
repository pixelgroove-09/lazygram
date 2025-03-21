"use client"

import { useState, useEffect } from "react"
import { Edit, Save, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getImages, updateCaption, deleteImage, scheduleImage } from "@/app/actions/image-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGallery } from "@/contexts/gallery-context"

interface ImageItem {
  id: string
  url: string
  caption: string
  hashtags: string[]
  createdAt: string
  scheduled?: boolean
  scheduledTime?: string
}

export default function ImageGallery() {
  const { refreshTrigger } = useGallery()
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedCaption, setEditedCaption] = useState("")
  const [editedHashtags, setEditedHashtags] = useState("")
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduledTime, setScheduledTime] = useState("")

  useEffect(() => {
    loadImages()
  }, [refreshTrigger]) // Reload when refreshTrigger changes

  const loadImages = async () => {
    try {
      setLoading(true)
      const data = await getImages()
      setImages(data)
    } catch (error) {
      console.error("Failed to load images:", error)
      toast({
        title: "Error loading images",
        description: "Could not load your images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (image: ImageItem) => {
    setEditingId(image.id)
    setEditedCaption(image.caption)
    setEditedHashtags(image.hashtags.join(" "))
  }

  const handleSave = async (id: string) => {
    try {
      const hashtags = editedHashtags
        .split(/\s+/)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .filter(Boolean)

      await updateCaption(id, editedCaption, hashtags)

      setImages(images.map((img) => (img.id === id ? { ...img, caption: editedCaption, hashtags } : img)))

      setEditingId(null)
      toast({
        title: "Caption updated",
        description: "Your caption has been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update caption:", error)
      toast({
        title: "Update failed",
        description: "Could not update the caption. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      await deleteImage(id)
      setImages(images.filter((img) => img.id !== id))
      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete image:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openScheduleDialog = (image: ImageItem) => {
    setSchedulingId(image.id)

    // Set default time to tomorrow at noon
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0)

    setScheduledTime(tomorrow.toISOString().slice(0, 16)) // Format: YYYY-MM-DDTHH:MM
  }

  const handleSchedule = async () => {
    if (!schedulingId) return

    try {
      await scheduleImage(schedulingId, new Date(scheduledTime).toISOString())

      setImages(images.map((img) => (img.id === schedulingId ? { ...img, scheduled: true, scheduledTime } : img)))

      setSchedulingId(null)
      toast({
        title: "Post scheduled",
        description: "Your post has been scheduled successfully.",
      })
    } catch (error) {
      console.error("Failed to schedule post:", error)
      toast({
        title: "Scheduling failed",
        description: "Could not schedule the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Render skeleton loading UI
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square relative">
              <Skeleton className="h-full w-full" />
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map((tag) => (
                    <Skeleton key={tag} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4 pt-0">
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No images uploaded yet. Upload some images to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {images.map((image) => (
        <Card key={image.id} className="overflow-hidden">
          <div className="aspect-square relative">
            <img src={image.url || "/placeholder.svg"} alt="Uploaded content" className="w-full h-full object-cover" />
            {image.scheduled && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Scheduled
              </div>
            )}
          </div>
          <CardContent className="p-4">
            {editingId === image.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  placeholder="Caption"
                  className="min-h-[100px]"
                />
                <Textarea
                  value={editedHashtags}
                  onChange={(e) => setEditedHashtags(e.target.value)}
                  placeholder="Hashtags (space separated)"
                  className="min-h-[60px]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">{image.caption}</p>
                <div className="flex flex-wrap gap-1">
                  {image.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between p-4 pt-0">
            <div className="flex space-x-2">
              {editingId === image.id ? (
                <Button variant="outline" size="sm" onClick={() => handleSave(image.id)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleEdit(image)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              <Dialog open={schedulingId === image.id} onOpenChange={(open) => !open && setSchedulingId(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openScheduleDialog(image)}
                    disabled={image.scheduled}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Post</DialogTitle>
                    <DialogDescription>Choose when you want this post to be published to Instagram.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Date and Time</Label>
                      <Input
                        id="schedule-time"
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSchedulingId(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSchedule}>Schedule Post</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Button variant="destructive" size="sm" onClick={() => handleDelete(image.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

