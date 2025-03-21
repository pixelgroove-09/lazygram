"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface ScheduledImage {
  id: string
  url: string
  caption: string
  hashtags: string[]
  scheduledTime: string
}

interface PostCalendarProps {
  scheduledPosts: ScheduledImage[]
}

export default function PostCalendar({ scheduledPosts }: PostCalendarProps) {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedPost, setSelectedPost] = useState<ScheduledImage | null>(null)

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledTime)
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const posts = getPostsForDate(date)
    if (posts.length > 0) {
      setSelectedPost(posts[0])
    } else {
      setSelectedPost(null)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  }

  // Render calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>)
    }

    // Add cells for each day in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const postsForDay = getPostsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <div
          key={`day-${day}`}
          className={`h-24 border border-gray-200 p-1 cursor-pointer transition-colors
            ${isToday ? "bg-blue-50 border-blue-200" : ""}
            ${isSelected ? "bg-blue-100 border-blue-300" : ""}
            ${postsForDay.length > 0 ? "hover:bg-blue-50" : "hover:bg-gray-50"}
          `}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex justify-between">
            <span className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>{day}</span>
            {postsForDay.length > 0 && (
              <span className="text-xs bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
                {postsForDay.length}
              </span>
            )}
          </div>

          {postsForDay.length > 0 && (
            <div className="mt-1 overflow-hidden">
              {postsForDay.map((post, index) => (
                <div key={post.id} className="text-xs p-0.5 bg-blue-100 text-blue-800 rounded mb-0.5 truncate">
                  {formatTime(post.scheduledTime)}
                </div>
              ))}
            </div>
          )}
        </div>,
      )
    }

    return days
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Post Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar header (days of week) */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

        {/* Post details dialog */}
        <Dialog open={selectedPost !== null} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDate && formatDate(selectedDate)}</DialogTitle>
              <DialogDescription>
                {selectedPost ? "Scheduled post details" : "No posts scheduled for this date"}
              </DialogDescription>
            </DialogHeader>

            {selectedPost && (
              <div className="py-4">
                <div className="flex items-start space-x-4">
                  <div className="h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={selectedPost.url || "/placeholder.svg"}
                      alt="Scheduled post"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">{selectedPost.caption}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <CalendarIcon className="h-3 w-3 inline mr-1" />
                      {formatTime(selectedPost.scheduledTime)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {selectedPost.hashtags.length > 5 && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          +{selectedPost.hashtags.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setSelectedPost(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      router.push("/?tab=schedule")
                      setSelectedPost(null)
                    }}
                  >
                    Manage Schedule
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

