import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InstagramSettings from "@/components/instagram-settings"
import InstagramTroubleshooting from "@/components/instagram-troubleshooting"
import InstagramErrorHandler from "@/components/instagram-error-handler"
import EnvironmentDiagnostic from "@/components/environment-diagnostic"
import MockModeToggle from "@/components/mock-mode-toggle"
import InstagramConnectionDebug from "@/components/instagram-connection-debug"
import ScheduleSettings from "@/components/schedule-settings"
import ThematicPromptSettings from "@/components/thematic-prompt-settings"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Settings - Lazygram",
  description: "Manage your Instagram connection, prompts, and app settings",
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const tab = searchParams.tab || "instagram"

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your Instagram connection, prompts, and posting schedule" />

      <InstagramErrorHandler />

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8 w-full max-w-md">
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        </TabsList>

        <TabsContent value="instagram" className="space-y-6">
          <InstagramSettings />
          <InstagramTroubleshooting />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleSettings />
        </TabsContent>

        <TabsContent value="prompts">
          <ThematicPromptSettings />
        </TabsContent>

        <TabsContent value="diagnostic">
          <div className="space-y-6">
            <EnvironmentDiagnostic />
            <MockModeToggle />
            <InstagramConnectionDebug />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

