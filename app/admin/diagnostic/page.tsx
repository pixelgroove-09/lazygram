import type { Metadata } from "next"
import InstagramDiagnostic from "@/components/instagram-diagnostic"
import PageHeader from "@/components/layout/page-header"
import DbInitializer from "@/components/db-initializer"

export const metadata: Metadata = {
  title: "Instagram Diagnostic - Lazygram",
  description: "Diagnose Instagram connection issues",
}

export default function DiagnosticPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Instagram Diagnostic" description="Test your Instagram connection and troubleshoot issues" />
        <DbInitializer />
      </div>

      <InstagramDiagnostic />
    </div>
  )
}

