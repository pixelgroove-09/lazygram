"use client"

import { useState, useEffect } from "react"
import { Clock, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { getScheduleSettings, updateScheduleSettings } from "@/app/actions/schedule-actions"
import ScheduledPosts from "@/components/scheduled-posts"

interface ScheduleSettings {
  enabled: boolean
  frequency: "daily" | "weekly" | "custom"
  time: string
  daysOfWeek: number[]
  customDays: number
}

export default function ScheduleSettings() {
  const [settings, setSettings] = useState<ScheduleSettings>({
    enabled: false,
    frequency: "daily",
    time: "12:00",
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    customDays: 2,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  // Update the loadSettings function
  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getScheduleSettings()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error("Failed to load schedule settings:", error)
      toast({
        title: "Error loading settings",
        description: "Could not load your schedule settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update the handleSave function
  const handleSave = async () => {
    try {
      setSaving(true)
      await updateScheduleSettings(settings)
      toast({
        title: "Settings saved",
        description: "Your schedule settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save schedule settings:", error)
      toast({
        title: "Save failed",
        description: "Could not save your schedule settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: number) => {
    if (settings.daysOfWeek.includes(day)) {
      setSettings({
        ...settings,
        daysOfWeek: settings.daysOfWeek.filter((d) => d !== day),
      })
    } else {
      setSettings({
        ...settings,
        daysOfWeek: [...settings.daysOfWeek, day].sort(),
      })
    }
  }

  const getDayName = (day: number) => {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Loading your schedule settings...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schedule Settings</CardTitle>
          <CardDescription>Configure when your posts will be published to Instagram</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-posting">Automatic Posting</Label>
              <p className="text-sm text-muted-foreground">Enable or disable automatic posting to Instagram</p>
            </div>
            <Switch
              id="auto-posting"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          <div className="space-y-3">
            <Label>Posting Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value: "daily" | "weekly" | "custom") => setSettings({ ...settings, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (select days)</SelectItem>
                <SelectItem value="custom">Custom (every X days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.frequency === "weekly" && (
            <div className="space-y-3">
              <Label>Days of the Week</Label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={settings.daysOfWeek.includes(day) ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => toggleDay(day)}
                  >
                    {getDayName(day).substring(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {settings.frequency === "custom" && (
            <div className="space-y-3">
              <Label htmlFor="custom-days">Post every X days</Label>
              <Input
                id="custom-days"
                type="number"
                min="1"
                max="30"
                value={settings.customDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customDays: Number.parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="post-time">Posting Time</Label>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="post-time"
                type="time"
                value={settings.time}
                onChange={(e) => setSettings({ ...settings, time: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Schedule Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ScheduledPosts />
    </div>
  )
}

