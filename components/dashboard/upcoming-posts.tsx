"use client"

import { useState } from "react"
import { Calendar, Edit, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "@/components/ui/use-toast"
import { scheduleImage, unscheduleImage } from "@/app/actions/image-actions"
import { useRouter } from "next/navigation"

interface ScheduledImage {
  id: string
  url: string
  caption: string
  hashtags: string[]
  scheduledTime: string
}

interface UpcomingPostsProps {
  scheduledPosts: ScheduledImage[]
}

export default function UpcomingPosts({ scheduledPosts }: UpcomingPostsProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedScheduledTime, setEditedScheduledTime] = useState("")
  const [saving, setSaving] = useState(false)

  // Sort posts by scheduled time (earliest first)
  const sortedPosts = [...scheduledPosts].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  )

  const handleEditSchedule = (post: ScheduledImage) => {
    setEditingId(post.id)
    // Format the date for the datetime-local input (YYYY-MM-DDTHH:MM)
    const scheduledDate = new Date(post.scheduledTime)
    setEditedScheduledTime(scheduledDate.toISOString().slice(0, 16))
  }

  const handleSaveSchedule = async () => {
    if (!editingId) return

    try {
      setSaving(true)
      await scheduleImage(editingId, new Date(editedScheduledTime).toISOString())

      setEditingId(null)
      toast({
        title: "Schedule updated",
        description: "The post has been rescheduled successfully.",
      })

      router.refresh()
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

  const handleUnschedule = async (id: string) => {
    if (!confirm("Are you sure you want to unschedule this post?")) return

    try {
      await unscheduleImage(id)
      toast({
        title: "Post unscheduled",
        description: "The post has been removed from the schedule.",
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to unschedule post:", error)
      toast({
        title: "Error unscheduling post",
        description: "Could not unschedule the post. Please try again.",
        variant: "destructive",
      })
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

  const getTimeFromNow = (timeString: string) => {
    const now = new Date()
    const scheduledTime = new Date(timeString)
    const diffMs = scheduledTime.getTime() - now.getTime()

    // If in the past
    if (diffMs < 0) return "Overdue"

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
    } else {
      return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
    }
  }

  if (sortedPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No posts scheduled yet.</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Upload Images
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedPosts.map((post) => (
            <div key={post.id} className="flex items-start space-x-4 pb-6 border-b last:border-0 last:pb-0">
              <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img src={post.url || "/placeholder.svg"} alt="Scheduled post" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{post.caption}</p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatScheduledTime(post.scheduledTime)}</span>
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {getTimeFromNow(post.scheduledTime)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.hashtags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {post.hashtags.length > 3 && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">+{post.hashtags.length - 3} more</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditSchedule(post)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleUnschedule(post.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
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
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

