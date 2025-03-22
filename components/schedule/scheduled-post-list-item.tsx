"use client"

import { format, parseISO } from "date-fns"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock } from "lucide-react"

interface ScheduledPostListItemProps {
  post: any
}

export function ScheduledPostListItem({ post }: ScheduledPostListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  const scheduledTime = parseISO(post.scheduledTime)
  const formattedTime = format(scheduledTime, "h:mm a")

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white border border-gray-200 rounded-md cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <img src={post.url || "/placeholder.svg"} alt="Post" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">
            {post.caption.substring(0, 60)}
            {post.caption.length > 60 ? "..." : ""}
          </p>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 mr-1" />
            {formattedTime}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {post.hashtags.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">
                {tag}
              </span>
            ))}
            {post.hashtags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{post.hashtags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

