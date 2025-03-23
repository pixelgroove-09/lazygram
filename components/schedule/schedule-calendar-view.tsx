"use client"

import { useState, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isSameMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { CalendarDay } from "./calendar-day"
import { UnscheduledPostsSidebar } from "./unscheduled-posts-sidebar"
import { updateScheduledTime, scheduleUnscheduledImage, removeFromSchedule } from "@/app/actions/schedule-actions"

// Helper function to clean up captions by removing numbering and prefixes
function cleanCaption(text: string): string {
  if (!text) return ""
  // Remove patterns like "1. Caption:", "1.", "2.", etc.
  return text
    .replace(/^\d+\.\s*(Caption:\s*)?/i, "") // Remove starting numbers and "Caption:" prefix
    .replace(/\s*\d+\.\s*$/g, "") // Remove trailing numbers like "2." at the end
    .trim()
}

interface ScheduleCalendarViewProps {
  scheduledImages: any[]
  unscheduledImages: any[]
}

export default function ScheduleCalendarView({
  scheduledImages: initialScheduledImages,
  unscheduledImages: initialUnscheduledImages,
}: ScheduleCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledImages, setScheduledImages] = useState(initialScheduledImages)
  const [unscheduledImages, setUnscheduledImages] = useState(initialUnscheduledImages)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<any | null>(null)

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Get days for the current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Navigate to previous month
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Navigate to next month
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  // Find active image for drag overlay
  useEffect(() => {
    if (activeId) {
      const image = [...scheduledImages, ...unscheduledImages].find((img) => img.id === activeId)
      setActiveImage(image)
    } else {
      setActiveImage(null)
    }
  }, [activeId, scheduledImages, unscheduledImages])

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  // Handle drag end
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // If dropping on a day
    if (over.id.toString().startsWith("day-")) {
      const dayDate = over.id.toString().replace("day-", "")
      const imageId = active.id

      // Check if it's from unscheduled or scheduled
      const isFromUnscheduled = unscheduledImages.some((img) => img.id === imageId)

      try {
        // Set time to noon of the selected day
        const targetDate = new Date(dayDate)
        targetDate.setHours(12, 0, 0, 0)

        if (isFromUnscheduled) {
          // Move from unscheduled to scheduled
          await scheduleUnscheduledImage(imageId, targetDate.toISOString())

          // Update local state
          const imageToMove = unscheduledImages.find((img) => img.id === imageId)
          if (imageToMove) {
            setUnscheduledImages(unscheduledImages.filter((img) => img.id !== imageId))
            setScheduledImages([
              ...scheduledImages,
              {
                ...imageToMove,
                scheduled: true,
                scheduledTime: targetDate.toISOString(),
              },
            ])
          }

          toast({
            title: "Post scheduled",
            description: `Post scheduled for ${format(targetDate, "MMMM d, yyyy")}`,
          })
        } else {
          // Update scheduled time
          await updateScheduledTime(imageId, targetDate.toISOString())

          // Update local state
          setScheduledImages(
            scheduledImages.map((img) =>
              img.id === imageId ? { ...img, scheduledTime: targetDate.toISOString() } : img,
            ),
          )

          toast({
            title: "Schedule updated",
            description: `Post moved to ${format(targetDate, "MMMM d, yyyy")}`,
          })
        }
      } catch (error) {
        console.error("Error updating schedule:", error)
        toast({
          title: "Error",
          description: "Failed to update schedule",
          variant: "destructive",
        })
      }
    }

    // If dropping on unscheduled area
    if (over.id === "unscheduled-area") {
      const imageId = active.id

      // Only process if it's a scheduled image
      const isScheduled = scheduledImages.some((img) => img.id === imageId)

      if (isScheduled) {
        try {
          // Remove from schedule
          await removeFromSchedule(imageId)

          // Update local state
          const imageToMove = scheduledImages.find((img) => img.id === imageId)
          if (imageToMove) {
            setScheduledImages(scheduledImages.filter((img) => img.id !== imageId))
            setUnscheduledImages([
              ...unscheduledImages,
              {
                ...imageToMove,
                scheduled: false,
                scheduledTime: null,
              },
            ])
          }

          toast({
            title: "Post unscheduled",
            description: "Post removed from schedule",
          })
        } catch (error) {
          console.error("Error removing from schedule:", error)
          toast({
            title: "Error",
            description: "Failed to remove from schedule",
            variant: "destructive",
          })
        }
      }
    }

    setActiveId(null)
  }

  // Group posts by day
  const getPostsForDay = (day: Date) => {
    return scheduledImages.filter((image) => {
      const scheduledDate = parseISO(image.scheduledTime)
      return isSameDay(scheduledDate, day)
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex-1">
          <Card className="lazygram-card border-0">
            <CardContent className="p-6">
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className="rounded-full hover:bg-primary-50 hover:text-primary-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-bold text-gray-800">{format(currentMonth, "MMMM yyyy")}</h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="rounded-full hover:bg-primary-50 hover:text-primary-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium py-1 text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before the first day of month */}
                {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-24 rounded-xl bg-gray-50"></div>
                ))}

                {/* Calendar days */}
                {monthDays.map((day) => {
                  const dayPosts = getPostsForDay(day)
                  const dayId = `day-${format(day, "yyyy-MM-dd")}`

                  return (
                    <CalendarDay
                      key={dayId}
                      id={dayId}
                      day={day}
                      posts={dayPosts}
                      isCurrentMonth={isSameMonth(day, currentMonth)}
                    />
                  )
                })}

                {/* Empty cells for days after the last day of month */}
                {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                  <div key={`empty-end-${index}`} className="h-24 rounded-xl bg-gray-50"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unscheduled posts sidebar */}
        <UnscheduledPostsSidebar unscheduledImages={unscheduledImages} />

        {/* Drag overlay */}
        <DragOverlay>
          {activeImage && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-lg border border-primary-300">
              <img
                src={activeImage.url || "/placeholder.svg"}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

