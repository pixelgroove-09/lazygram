"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface UnscheduledPostItemProps {
  post: any
}

export function UnscheduledPostItem({ post }: UnscheduledPostItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-2 bg-white border border-gray-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <img src={post.url || "/placeholder.svg"} alt="Post" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate">
            {post.caption.substring(0, 50)}
            {post.caption.length > 50 ? "..." : ""}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {post.hashtags.slice(0, 2).map((tag: string, i: number) => (
              <span key={i} className="text-[10px] bg-muted px-1 rounded-sm">
                {tag}
              </span>
            ))}
            {post.hashtags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{post.hashtags.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

