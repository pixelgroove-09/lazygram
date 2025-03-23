import type { Metadata } from "next"
import FileBrowser from "@/components/file-browser"

export const metadata: Metadata = {
  title: "Storage Management | Lazygram",
  description: "Manage your uploaded files and images",
}

export default function StoragePage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Storage Management</h1>
      <p className="text-muted-foreground">Browse, upload, and manage your files and images</p>

      <FileBrowser />
    </div>
  )
}

