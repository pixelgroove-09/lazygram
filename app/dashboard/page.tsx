import type { Metadata } from "next"
import DashboardMetrics from "@/components/dashboard/dashboard-metrics"
import UpcomingPosts from "@/components/dashboard/upcoming-posts"
import PostCalendar from "@/components/dashboard/post-calendar"
import RecentActivity from "@/components/dashboard/recent-activity"
import InstagramConnect from "@/components/dashboard/instagram-connect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInstagramSettings } from "@/app/actions/instagram-actions"
import { getScheduledImages } from "@/app/actions/image-actions"
import { getImages } from "@/app/actions/image-actions"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Dashboard - Lazygram",
  description: "Manage your Instagram content and scheduling",
}

export default async function DashboardPage() {
  // Fetch data for the dashboard
  const instagramSettings = await getInstagramSettings()
  const scheduledPosts = await getScheduledImages()
  const allImages = await getImages()

  // Filter for posted images (those with postedAt not null)
  const postedImages = allImages.filter((img) => img.postedAt !== null)

  // Filter for uploaded but not scheduled images
  const uploadedNotScheduled = allImages.filter((img) => !img.scheduled && img.postedAt === null)

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your Instagram content and scheduling" />

      {!instagramSettings.connected && <InstagramConnect />}

      <DashboardMetrics
        scheduledCount={scheduledPosts.length}
        postedCount={postedImages.length}
        uploadedCount={uploadedNotScheduled.length}
      />

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="upcoming">Upcoming Posts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <UpcomingPosts scheduledPosts={scheduledPosts} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <PostCalendar scheduledPosts={scheduledPosts} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <RecentActivity postedImages={postedImages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

