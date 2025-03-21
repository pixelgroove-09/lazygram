import type { Metadata } from "next"
import ScheduleSettings from "@/components/schedule-settings"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Schedule Posts - Lazygram",
  description: "Configure and manage your posting schedule",
}

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Schedule Posts" description="Configure when your posts will be published to Instagram" />

      <ScheduleSettings />
    </div>
  )
}

