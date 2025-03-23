import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface UnscheduledPostItemProps {
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

export function UnscheduledPostItem({ post }: UnscheduledPostItemProps) {
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
        flex items-center space-x-3 p-3 rounded-xl cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : "opacity-100"}
        bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow
      `}
    >
      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img src={post.url || "/placeholder.svg"} alt="Post" className="h-full w-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-gray-800">{cleanCaption(post.caption).substring(0, 30)}...</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {post.hashtags.slice(0, 2).map((tag: string, i: number) => (
            <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {post.hashtags.length > 2 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              +{post.hashtags.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

