import { Suspense } from "react"
import { ScheduledPostsList } from "@/components/scheduled-posts-list"
import { ScheduleHeader } from "@/components/schedule-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Schedule | Lazygram",
  description: "Manage your scheduled Instagram posts",
}

export default function SchedulePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <ScheduleHeader />

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
          <CardDescription>Manage your upcoming Instagram posts</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ScheduleListSkeleton />}>
            <ScheduledPostsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function ScheduleListSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
    </div>
  )
}

