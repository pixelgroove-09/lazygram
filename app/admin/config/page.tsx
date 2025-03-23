import type { Metadata } from "next"
import ConfigSettings from "@/components/config-settings"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Configuration Settings - Lazygram",
  description: "Configure application settings",
}

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration Settings"
        description="Configure application settings and toggle between mock and live mode"
      />

      <ConfigSettings />
    </div>
  )
}

