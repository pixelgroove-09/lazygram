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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard - Lazygram",
  description: "Manage your Instagram content and scheduling",
}

// Update the DashboardPage component to handle potential errors
export default async function DashboardPage() {
  // Fetch data for the dashboard with error handling
  let instagramSettings = { connected: false, accountName: "", accountId: "" }
  let scheduledPosts = []
  let allImages = []
  let postedImages = []
  let uploadedNotScheduled = []

  try {
    instagramSettings = await getInstagramSettings()
  } catch (error) {
    console.error("Failed to load Instagram settings:", error)
  }

  try {
    scheduledPosts = await getScheduledImages()
  } catch (error) {
    console.error("Failed to load scheduled posts:", error)
    scheduledPosts = [] // Ensure it's an empty array if there's an error
  }

  try {
    allImages = await getImages()

    // Filter for posted images (those with postedAt not null)
    postedImages = allImages.filter((img) => img.postedAt !== null)

    // Filter for uploaded but not scheduled images
    uploadedNotScheduled = allImages.filter((img) => !img.scheduled && img.postedAt === null)
  } catch (error) {
    console.error("Failed to load images:", error)
    allImages = []
    postedImages = []
    uploadedNotScheduled = []
  }

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
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mb-6 p-1 bg-background border rounded-xl">
          <TabsTrigger
            value="upcoming"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Upcoming Posts
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Calendar
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div>
            <UpcomingPosts scheduledPosts={scheduledPosts} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <PostCalendar scheduledPosts={scheduledPosts} />
            </div>
            <div className="lg:col-span-1">
              <Card className="lazygram-card border-0 h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Calendar Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Optimize your posting schedule for maximum engagement.</p>
                    <ul className="text-sm space-y-2 mt-4 list-disc pl-5">
                      <li>Post during peak hours (9-11 AM, 7-9 PM)</li>
                      <li>Maintain a consistent posting schedule</li>
                      <li>Space out similar content types</li>
                      <li>Use analytics to refine your timing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <RecentActivity postedImages={postedImages} />
            </div>
            <div className="lg:col-span-1">
              <Card className="lazygram-card border-0 h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Posts This Month</p>
                      <p className="text-2xl font-bold">{postedImages.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Scheduled</p>
                      <p className="text-2xl font-bold">{scheduledPosts.length}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Ready to Schedule</p>
                      <p className="text-2xl font-bold">{uploadedNotScheduled.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <Card className="lazygram-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Engagement Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Analytics dashboard coming soon!</p>
                    <p className="text-sm text-gray-400">Track likes, comments, and saves.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="lazygram-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Follower analytics coming soon!</p>
                    <p className="text-sm text-gray-400">Monitor your account growth over time.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="lazygram-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Content Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Performance metrics coming soon!</p>
                    <p className="text-sm text-gray-400">See which content types perform best.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="lazygram-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Audience Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Audience data coming soon!</p>
                    <p className="text-sm text-gray-400">Learn about your followers' demographics.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

