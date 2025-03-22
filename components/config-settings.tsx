"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Save, Loader2 } from "lucide-react"
import { instagramConfig } from "@/lib/config"
import { useRouter } from "next/navigation"

export default function ConfigSettings() {
  const [mockMode, setMockMode] = useState(instagramConfig.useMockMode)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    try {
      setSaving(true)

      // In a real application, this would save to the server
      // For now, we'll just update the local config and reload

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the config
      instagramConfig.useMockMode = mockMode

      toast({
        title: "Settings saved",
        description: `Instagram mode set to ${mockMode ? "Mock" : "Live"}.`,
      })

      // Refresh the page to apply changes
      router.refresh()
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Save failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram API Mode</CardTitle>
        <CardDescription>Configure whether to use the real Instagram API or mock mode for testing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Changing these settings affects how the application interacts with Instagram. In live mode, posts will be
            published to your actual Instagram account.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mock-mode">Mock Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, Instagram operations will be simulated and no real posts will be made
            </p>
          </div>
          <Switch id="mock-mode" checked={mockMode} onCheckedChange={setMockMode} />
        </div>

        {!mockMode && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Live Mode</AlertTitle>
            <AlertDescription className="text-blue-700">
              You are about to enable live mode. Make sure you have properly configured your Instagram App ID and App
              Secret in the environment variables.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

