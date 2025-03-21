import type { Metadata } from "next"
import UploadForm from "@/components/upload-form"
import ImageGallery from "@/components/image-gallery"
import { GalleryProvider } from "@/contexts/gallery-context"
import PageHeader from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Upload Images - Lazygram",
  description: "Upload images and generate AI captions",
}

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Upload Images" description="Upload multiple images to generate captions with AI" />

      <GalleryProvider>
        <UploadForm />
        <ImageGallery />
      </GalleryProvider>
    </div>
  )
}

