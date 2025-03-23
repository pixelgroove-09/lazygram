import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import PageHeader from "@/components/layout/page-header"
import ProfileForm from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Profile - Lazygram",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  // Require authentication
  const user = await requireAuth()

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account settings" />

      <ProfileForm user={user} />
    </div>
  )
}

