"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InstagramErrorHandler() {
  const [error, setError] = useState<{
    type: string
    message: string
    debug?: string
  } | null>(null)

  useEffect(() => {
    // Check URL parameters for errors
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get("error")
    const errorDescription = urlParams.get("error_description")
    const errorDebug = urlParams.get("error_debug")

    if (errorParam && errorDescription) {
      setError({
        type: errorParam,
        message: errorDescription,
        debug: errorDebug || undefined,
      })

      // Clean up URL params
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [])

  if (!error) return null

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Instagram Error: {error.type}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        {error.debug && (
          <details className="text-xs mt-2">
            <summary>Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-destructive/10 p-2 rounded">{error.debug}</pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  )
}

