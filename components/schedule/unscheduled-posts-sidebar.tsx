"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UnscheduledPostItem } from "./unscheduled-post-item"

interface UnscheduledPostsSidebarProps {
  unscheduledImages: any[]
}

export function UnscheduledPostsSidebar({ unscheduledImages }: UnscheduledPostsSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled-area",
  })

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <Card className={`h-full ${isOver ? "border-blue-300 bg-blue-50" : ""}`}>
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Unscheduled Posts</CardTitle>
        </CardHeader>
        <CardContent ref={setNodeRef} className="p-3 overflow-y-auto max-h-[calc(100vh-250px)] min-h-[300px]">
          {unscheduledImages.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No unscheduled posts available</div>
          ) : (
            <SortableContext items={unscheduledImages.map((img) => img.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {unscheduledImages.map((image) => (
                  <UnscheduledPostItem key={image.id} post={image} />
                ))}
              </div>
            </SortableContext>
          )}

          {isOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-70 pointer-events-none">
              <div className="text-sm text-blue-600 font-medium">Drop to unschedule</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

