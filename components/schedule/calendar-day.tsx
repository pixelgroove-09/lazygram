import { format, isToday } from "date-fns"
import { useDroppable } from "@dnd-kit/core"
import { ScheduledPostItem } from "./scheduled-post-item"

interface CalendarDayProps {
  id: string
  day: Date
  posts: any[]
  isCurrentMonth: boolean
}

// Helper function to clean up captions by removing numbering and prefixes
function cleanCaption(text: string): string {
  if (!text) return ""
  // Remove patterns like "1. Caption:", "1.", "2.", etc.
  return text
    .replace(/^\d+\.\s*(Caption:\s*)?/i, "") // Remove starting numbers and "Caption:" prefix
    .replace(/\s*\d+\.\s*$/g, "") // Remove trailing numbers like "2." at the end
    .trim()
}

export function CalendarDay({ id, day, posts, isCurrentMonth }: CalendarDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const dayNumber = day.getDate()
  const isCurrentDay = isToday(day)

  return (
    <div
      ref={setNodeRef}
      className={`
        h-24 rounded-xl overflow-hidden border p-1
        ${isOver ? "bg-primary-50 border-primary-300" : "border-gray-100"}
        ${isCurrentDay ? "ring-2 ring-primary-500 ring-offset-2" : ""}
        ${!isCurrentMonth ? "bg-background opacity-60" : "bg-white"}
      `}
    >
      <div className="h-full flex flex-col">
        <div className={`text-xs font-medium p-1 ${isCurrentDay ? "text-primary-500" : "text-gray-600"}`}>
          {format(day, "d")}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent p-0.5">
          {posts.length > 0 ? (
            <div className="space-y-1">
              {posts.map((post) => (
                <ScheduledPostItem key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-gray-400">Drop here</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

