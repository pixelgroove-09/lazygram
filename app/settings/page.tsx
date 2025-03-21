import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InstagramSettings from "@/components/instagram-settings"
import InstagramTroubleshooting from "@/components/instagram-troubleshooting"
import InstagramErrorHandler from "@/components/instagram-error-handler"
import ScheduleSettings from "@/components/schedule-settings"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Settings - Lazygram",
  description: "Manage your Instagram connection and app settings",
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const tab = searchParams.tab || "instagram"

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your Instagram connection and posting schedule" />

      <InstagramErrorHandler />

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-8 w-full max-w-md">
          <TabsTrigger value="instagram">Instagram Connection</TabsTrigger>
          <TabsTrigger value="schedule">Posting Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="instagram" className="space-y-6">
          <InstagramSettings />
          <InstagramTroubleshooting />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

