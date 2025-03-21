"use client"

import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function InstagramConnect() {
  const router = useRouter()

  const handleConnect = () => {
    router.push("/settings?tab=instagram")
  }

  return (
    <Card className="p-6 mb-8 border-yellow-200 bg-yellow-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="bg-yellow-100 p-2 rounded-full">
            <Instagram className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Connect your Instagram account</h3>
            <p className="text-muted-foreground">
              You need to connect your Instagram business account to start posting. Scheduled posts will not be
              published until you connect your account.
            </p>
          </div>
        </div>
        <Button onClick={handleConnect}>Connect Account</Button>
      </div>
    </Card>
  )
}

