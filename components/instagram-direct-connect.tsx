"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function InstagramDirectConnect() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDirectConnect = async () => {
    try {
      setLoading(true)
      toast({
        title: "Connecting...",
        description: "Setting up mock Instagram connection",
      })

      // Call the direct connect endpoint
      const response = await fetch("/api/instagram/direct-connect", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to connect")
      }

      const data = await response.json()

      toast({
        title: "Connected to Instagram",
        description: "Mock Instagram account has been connected successfully.",
      })

      // Use router.refresh() instead of full page reload
      router.refresh()

      // Wait a moment before updating the UI to show the success state
      setTimeout(() => {
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error("Direct connect error:", error)
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Instagram",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDirectConnect} disabled={loading} className="mt-4">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Mock Instagram (Direct)"
      )}
    </Button>
  )
}

