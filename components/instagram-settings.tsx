"use client"

import { useState, useEffect } from "react"
import { Instagram, Link, Unlink, Check, AlertCircle, Loader2, RefreshCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getInstagramSettings, disconnectInstagram } from "@/app/actions/instagram-actions"
import InstagramDirectConnect from "@/components/instagram-direct-connect"
import { useRouter } from "next/navigation"
import { isMockModeEnabled } from "@/lib/config"

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
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [isMockMode, setIsMockMode] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if we're in mock mode
    setIsMockMode(isMockModeEnabled())
    loadSettings()
  }, [])

  // Check for error or success in URL params when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get("error")
    const errorDescription = urlParams.get("error_description")
    const errorDebug = urlParams.get("error_debug")
    const success = urlParams.get("success")

    if (errorParam) {
      const errorMessage = errorDescription || "Unknown error"
      setError(`${errorParam}: ${errorMessage}`)
      setDebugInfo(errorDebug || null)

      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      })
    } else if (success) {
      toast({
        title: "Connected to Instagram",
        description: "Your Instagram account has been successfully connected.",
      })
      // Reload settings to get the updated connection status
      loadSettings()
    }

    // Clean up URL params
    if (errorParam || success) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      // Get Instagram settings from the server
      const data = await getInstagramSettings()
      setSettings({
        connected: data.connected,
        accountName: data.accountName,
        accountId: data.accountId,
        profilePicture: data.profilePicture,
      })
    } catch (error) {
      console.error("Failed to load Instagram settings:", error)
      setError(error instanceof Error ? error.message : "Failed to load Instagram settings. Please try again.")

      toast({
        title: "Error loading settings",
        description: "Could not load your Instagram settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    try {
      setConnecting(true)
      setError(null)
      setDebugInfo(null)

      // Direct browser navigation to the auth endpoint
      window.location.href = "/api/auth/instagram"
    } catch (error) {
      console.error("Failed to initiate Instagram connection:", error)
      setError(error instanceof Error ? error.message : "Failed to initiate Instagram connection. Please try again.")

      toast({
        title: "Connection failed",
        description: "Could not connect to Instagram. Please try again.",
        variant: "destructive",
      })
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Instagram account?")) return

    try {
      setDisconnecting(true)
      await disconnectInstagram()

      // Update the local state
      setSettings({
        connected: false,
        accountName: "",
        accountId: "",
        profilePicture: "",
      })

      toast({
        title: "Disconnected from Instagram",
        description: "Your Instagram account has been disconnected.",
      })

      // Refresh the page to update the UI
      router.refresh()
    } catch (error) {
      console.error("Failed to disconnect Instagram:", error)
      setError(error instanceof Error ? error.message : "Failed to disconnect Instagram. Please try again.")

      toast({
        title: "Disconnect failed",
        description: "Could not disconnect from Instagram. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleRefresh = () => {
    loadSettings()
    router.refresh()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instagram Settings</CardTitle>
          <CardDescription>Loading your Instagram settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Instagram Settings
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <CardDescription>Connect your Instagram business account for automatic posting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isMockMode && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Mock Mode Enabled</AlertTitle>
            <AlertDescription className="text-blue-700">
              You're using the mock Instagram integration. This allows you to test the app without a real Instagram
              business account. All Instagram operations will be simulated.
            </AlertDescription>
          </Alert>
        )}

        {!isMockMode && (
          <Alert className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Live Mode Enabled</AlertTitle>
            <AlertDescription className="text-green-700">
              You're using the real Instagram API. Your posts will be published to your actual Instagram business
              account.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              {debugInfo && (
                <details className="text-xs mt-2">
                  <summary>Technical Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-destructive/10 p-2 rounded">{debugInfo}</pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

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
                <p className="text-sm text-muted-foreground">
                  @{settings.accountName} {isMockMode && "(Mock)"}
                </p>
              </div>
            </div>

            <Alert variant="success" className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready to Post</AlertTitle>
              <AlertDescription className="text-green-700">
                Your Instagram account is connected and ready for automatic posting.
                {isMockMode && " (Note: Posts will be simulated in mock mode)"}
              </AlertDescription>
            </Alert>

            <Button variant="destructive" className="w-full" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect Instagram Account
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <Instagram className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Not Connected</p>
              <p className="text-sm text-muted-foreground">
                Connect your Instagram business account to enable automatic posting
                {isMockMode && " (Mock account will be used)"}
              </p>
            </div>

            {!isMockMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Instagram Business Account Required</AlertTitle>
                <AlertDescription>
                  You need a Facebook Page with an associated Instagram Business account to use this feature. Personal
                  Instagram accounts are not supported by Instagram's API for content publishing.
                </AlertDescription>
              </Alert>
            )}

            <Button variant="default" className="w-full" onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Connect Instagram Account {isMockMode && "(Mock)"}
                </>
              )}
            </Button>

            {isMockMode && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  If the standard connection method doesn't work, try the direct connection:
                </p>
                <InstagramDirectConnect />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

