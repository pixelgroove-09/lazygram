"use client"

import { useState } from "react"
import { format, parseISO, addDays, isSameDay } from "date-fns"
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ScheduledPostListItem } from "./scheduled-post-list-item"
import { UnscheduledPostsSidebar } from "./unscheduled-posts-sidebar"
import { updateScheduledTime, scheduleUnscheduledImage, removeFromSchedule } from "@/app/actions/schedule-actions"

interface ScheduleListViewProps {
  scheduledImages: any[]
  unscheduledImages: any[]
}

export default function ScheduleListView({
  scheduledImages: initialScheduledImages,
  unscheduledImages: initialUnscheduledImages,
}: ScheduleListViewProps) {
  const [startDate, setStartDate] = useState(new Date())
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

  // Generate dates for the next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  // Navigate to previous week
  const prevWeek = () => setStartDate(addDays(startDate, -7))

  // Navigate to next week
  const nextWeek = () => setStartDate(addDays(startDate, 7))

  // Find active image for drag overlay
  const findActiveImage = () => {
    if (activeId) {
      const image = [...scheduledImages, ...unscheduledImages].find((img) => img.id === activeId)
      setActiveImage(image)
    } else {
      setActiveImage(null)
    }
  }

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
    findActiveImage()
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
    <div className="flex flex-col lg:flex-row gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="flex-1">
          <Card>
            <CardContent className="p-4">
              {/* List view header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="icon" onClick={prevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(startDate, "MMMM d")} - {format(addDays(startDate, 6), "MMMM d, yyyy")}
                </h2>
                <Button variant="outline" size="icon" onClick={nextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Days list */}
              <div className="space-y-4">
                {dates.map((day) => {
                  const dayPosts = getPostsForDay(day)
                  const dayId = `day-${format(day, "yyyy-MM-dd")}`
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div key={dayId} className="space-y-2">
                      <div className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>
                        {format(day, "EEEE, MMMM d")}
                      </div>

                      <div
                        id={dayId}
                        className={`
                          border rounded-md p-3 min-h-[100px]
                          ${isToday ? "border-blue-300 bg-blue-50/30" : "border-gray-200"}
                        `}
                        data-droppable="true"
                      >
                        {dayPosts.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            No posts scheduled
                          </div>
                        ) : (
                          <SortableContext
                            items={dayPosts.map((post) => post.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {dayPosts.map((post) => (
                                <ScheduledPostListItem key={post.id} post={post} />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unscheduled posts sidebar */}
        <UnscheduledPostsSidebar unscheduledImages={unscheduledImages} />

        {/* Drag overlay */}
        <DragOverlay>
          {activeImage && (
            <div className="w-16 h-16 rounded-md overflow-hidden bg-white shadow-lg border border-primary">
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

