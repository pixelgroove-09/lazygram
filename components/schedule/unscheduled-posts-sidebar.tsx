import { useDroppable } from "@dnd-kit/core"
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
    <div className="w-full lg:w-80 flex-shrink-0">
      <Card className={`lazygram-card border-0 h-full ${isOver ? "bg-background" : ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Unscheduled Posts</CardTitle>
        </CardHeader>
        <CardContent ref={setNodeRef} className="p-4">
          {unscheduledImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No unscheduled posts available.</p>
              <p className="text-xs text-gray-400 mt-1">Drop scheduled posts here to unschedule them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unscheduledImages.map((image) => (
                <UnscheduledPostItem key={image.id} post={image} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

