"use client"

import { useState, useEffect } from "react"
import { Calendar, X, Edit, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getScheduledImages, unscheduleImage, scheduleImage } from "@/app/actions/image-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduledImage {
  id: string
  url: string
  caption: string
  hashtags: string[]
  scheduledTime: string
}

export default function ScheduledPosts() {
  const [scheduledImages, setScheduledImages] = useState<ScheduledImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedScheduledTime, setEditedScheduledTime] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadScheduledImages()
  }, [])

  const loadScheduledImages = async () => {
    try {
      setLoading(true)
      const images = await getScheduledImages()
      setScheduledImages(images)
    } catch (error) {
      console.error("Failed to load scheduled images:", error)
      toast({
        title: "Error loading scheduled posts",
        description: "Could not load your scheduled posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnschedule = async (id: string) => {
    try {
      await unscheduleImage(id)
      setScheduledImages(scheduledImages.filter((img) => img.id !== id))
      toast({
        title: "Post unscheduled",
        description: "The post has been removed from the schedule.",
      })
    } catch (error) {
      console.error("Failed to unschedule post:", error)
      toast({
        title: "Error unscheduling post",
        description: "Could not unschedule the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditSchedule = (image: ScheduledImage) => {
    setEditingId(image.id)
    // Format the date for the datetime-local input (YYYY-MM-DDTHH:MM)
    const scheduledDate = new Date(image.scheduledTime)
    setEditedScheduledTime(scheduledDate.toISOString().slice(0, 16))
  }

  const handleSaveSchedule = async () => {
    if (!editingId) return

    try {
      setSaving(true)
      await scheduleImage(editingId, new Date(editedScheduledTime).toISOString())

      // Update the local state
      setScheduledImages(
        scheduledImages.map((img) =>
          img.id === editingId ? { ...img, scheduledTime: new Date(editedScheduledTime).toISOString() } : img,
        ),
      )

      setEditingId(null)
      toast({
        title: "Schedule updated",
        description: "The post has been rescheduled successfully.",
      })
    } catch (error) {
      console.error("Failed to update schedule:", error)
      toast({
        title: "Update failed",
        description: "Could not update the schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatScheduledTime = (timeString: string) => {
    const date = new Date(timeString)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (scheduledImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No posts scheduled yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Upload images and schedule them to appear here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduledImages.map((image) => (
            <div key={image.id} className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt="Scheduled post"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{image.caption}</p>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatScheduledTime(image.scheduledTime)}</span>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSchedule(image)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUnschedule(image.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Schedule Dialog */}
        <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
              <DialogDescription>Change when this post will be published to Instagram.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-schedule-time">Date and Time</Label>
                <Input
                  id="edit-schedule-time"
                  type="datetime-local"
                  value={editedScheduledTime}
                  onChange={(e) => setEditedScheduledTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

