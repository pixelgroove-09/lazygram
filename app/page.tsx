import type { Metadata } from "next"
import UploadForm from "@/components/upload-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageGallery from "@/components/image-gallery"
import ScheduleSettings from "@/components/schedule-settings"
import InstagramSettings from "@/components/instagram-settings"
import { GalleryProvider } from "@/contexts/gallery-context"

export const metadata: Metadata = {
  title: "Lazygram - Instagram Automation",
  description: "Automate your Instagram posting with AI-generated captions",
}

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center space-y-6 text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Lazygram</h1>
        <p className="text-muted-foreground max-w-[600px]">
          Bulk upload images, generate AI captions, and schedule posts to your Instagram business account.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Posts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-8">
          <GalleryProvider>
            <UploadForm />
            <ImageGallery />
          </GalleryProvider>
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleSettings />
        </TabsContent>
        <TabsContent value="settings">
          <InstagramSettings />
        </TabsContent>
      </Tabs>
    </main>
  )
}

