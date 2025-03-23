import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface ScheduledPostItemProps {
  post: any
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

export function ScheduledPostItem({ post }: ScheduledPostItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center space-x-1 p-1 rounded-lg cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : "opacity-100"}
        bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow
      `}
    >
      <div className="h-6 w-6 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        <img src={post.url || "/placeholder.svg"} alt="Post" className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-gray-700">{cleanCaption(post.caption).substring(0, 20)}...</p>
      </div>
    </div>
  )
}

