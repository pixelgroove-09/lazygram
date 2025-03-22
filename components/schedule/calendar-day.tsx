"use client"

import { isToday } from "date-fns"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { ScheduledPostItem } from "./scheduled-post-item"

interface CalendarDayProps {
  id: string
  day: Date
  posts: any[]
  isCurrentMonth: boolean
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
        min-h-24 border p-1 transition-colors relative
        ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
        ${isCurrentDay ? "border-blue-300" : "border-gray-200"}
        ${isOver ? "bg-blue-50 border-blue-300" : ""}
      `}
    >
      <div className="flex justify-between">
        <span
          className={`
          text-sm font-medium
          ${isCurrentDay ? "text-blue-600" : ""}
          ${!isCurrentMonth ? "text-gray-400" : ""}
        `}
        >
          {dayNumber}
        </span>
        {posts.length > 0 && (
          <span className="text-xs bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
            {posts.length}
          </span>
        )}
      </div>

      <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
        <SortableContext items={posts.map((post) => post.id)} strategy={verticalListSortingStrategy}>
          {posts.map((post) => (
            <ScheduledPostItem key={post.id} post={post} />
          ))}
        </SortableContext>

        {isOver && posts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-70 pointer-events-none">
            <div className="text-xs text-blue-600 font-medium">Drop here</div>
          </div>
        )}
      </div>
    </div>
  )
}

