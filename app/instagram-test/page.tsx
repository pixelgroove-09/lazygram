import type { Metadata } from "next"
import InstagramTestPost from "@/components/instagram-test-post"
import PageHeader from "@/components/layout/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Instagram Test Post - Lazygram",
  description: "Test your Instagram connection by creating a post",
}

export default function InstagramTestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Test Post"
        description="Test your Instagram connection by creating and publishing a post"
      />

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Test Environment</AlertTitle>
        <AlertDescription>
          This page allows you to test your Instagram connection by creating and publishing a post. Make sure you have
          connected your Instagram account in the{" "}
          <Link href="/settings" className="underline">
            settings
          </Link>{" "}
          before testing.
        </AlertDescription>
      </Alert>

      <InstagramTestPost />
    </div>
  )
}

