"use client"

import { useState, useEffect } from "react"
import { Instagram, Link, Unlink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { mockInstagramAuth } from "@/lib/instagram-mock"
import { updateInstagramInDB, getInstagramFromDB } from "@/lib/db"

interface InstagramSettings {
  connected: boolean
  accountName: string
  accountId: string
  profilePicture?: string
}

export default function InstagramSettings() {
  const [settings, setSettings] = useState<InstagramSettings>({
    connected: false,
    accountName: "",
    accountId: "",
  })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Get Instagram settings from the database
      const data = await getInstagramFromDB()
      setSettings({
        connected: data.connected,
        accountName: data.accountName,
        accountId: data.accountId,
        profilePicture: data.profilePicture,
      })
    } catch (error) {
      console.error("Failed to load Instagram settings:", error)
      toast({
        title: "Error loading settings",
        description: "Could not load your Instagram settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setConnecting(true)

      // Use the mock authentication function
      const result = await mockInstagramAuth()

      if (result.success && result.account) {
        // Update the database with the mock account info
        await updateInstagramInDB({
          connected: true,
          accountName: result.account.username,
          accountId: result.account.id,
          profilePicture: result.account.profilePicture,
        })

        // Update the local state
        setSettings({
          connected: true,
          accountName: result.account.username,
          accountId: result.account.id,
          profilePicture: result.account.profilePicture,
        })

        toast({
          title: "Connected to Instagram",
          description: `Successfully connected to @${result.account.username}.`,
        })
      } else {
        throw new Error(result.error || "Failed to connect to Instagram")
      }
    } catch (error) {
      console.error("Failed to connect Instagram:", error)
      toast({
        title: "Connection failed",
        description: "Could not connect to Instagram. Please try again.",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Instagram account?")) return

    try {
      setDisconnecting(true)

      // Update the database
      await updateInstagramInDB({
        connected: false,
        accountName: "",
        accountId: "",
        profilePicture: "",
      })

      // Update the local state
      setSettings({
        connected: false,
        accountName: "",
        accountId: "",
      })

      toast({
        title: "Disconnected from Instagram",
        description: "Your Instagram account has been disconnected.",
      })
    } catch (error) {
      console.error("Failed to disconnect Instagram:", error)
      toast({
        title: "Disconnect failed",
        description: "Could not disconnect from Instagram. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instagram Settings</CardTitle>
          <CardDescription>Loading your Instagram settings...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram Settings</CardTitle>
        <CardDescription>Connect your Instagram business account for automatic posting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.connected ? (
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-muted rounded-lg">
              {settings.profilePicture ? (
                <img
                  src={settings.profilePicture || "/placeholder.svg"}
                  alt={settings.accountName}
                  className="h-12 w-12 rounded-full mr-4"
                />
              ) : (
                <Instagram className="h-8 w-8 mr-4 text-pink-500" />
              )}
              <div>
                <p className="font-medium">Connected to Instagram</p>
                <p className="text-sm text-muted-foreground">@{settings.accountName}</p>
              </div>
            </div>

            <Alert variant="success" className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready to Post</AlertTitle>
              <AlertDescription className="text-green-700">
                Your Instagram account is connected and ready for automatic posting.
              </AlertDescription>
            </Alert>

            <Button variant="destructive" className="w-full" onClick={handleDisconnect} disabled={disconnecting}>
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect Instagram Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <Instagram className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Not Connected</p>
              <p className="text-sm text-muted-foreground">
                Connect your Instagram business account to enable automatic posting
              </p>
            </div>

            <Alert>
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                This is a demo implementation. In a production environment, you would connect to the actual Instagram
                API.
              </AlertDescription>
            </Alert>

            <Button variant="default" className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                "Connecting..."
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Connect Instagram Account (Demo)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

