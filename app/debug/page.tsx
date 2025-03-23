import { InstagramConnectionDebug } from "@/components/instagram-connection-debug"

export const metadata = {
  title: "Debug Instagram Connection | Lazygram",
  description: "Debug and troubleshoot Instagram connection issues",
}

export default function DebugPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Instagram Connection Debugging</h1>
      <InstagramConnectionDebug />
    </div>
  )
}

