"use client"

import { format, parseISO } from "date-fns"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ScheduledPostItemProps {
  post: any
}

export function ScheduledPostItem({ post }: ScheduledPostItemProps) {
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
      className="text-xs p-1 bg-white border border-gray-200 rounded mb-1 cursor-grab active:cursor-grabbing flex items-center gap-1 hover:border-blue-300 transition-colors"
    >
      <div className="h-6 w-6 rounded-sm overflow-hidden bg-muted flex-shrink-0">
        <img src={post.url || "/placeholder.svg"} alt="Post" className="h-full w-full object-cover" />
      </div>
      <span className="truncate flex-1">{formattedTime}</span>
    </div>
  )
}

