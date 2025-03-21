"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InstagramDiagnostic() {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [simpleLoading, setSimpleLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [simpleResult, setSimpleResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [simpleError, setSimpleError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/instagram/diagnostic", {
        headers: {
          "x-admin-key": apiKey,
        },
      })

      const responseText = await response.text()

      try {
        const data = JSON.parse(responseText)

        if (!response.ok) {
          throw new Error(data.message || data.error || "Unknown error")
        }

        setResult(data)
      } catch (parseError) {
        console.error("Failed to parse response:", responseText)
        throw new Error(`Invalid response: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`)
      }
    } catch (err) {
      console.error("Diagnostic error:", err)
      setError(err.message || "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const runSimpleDiagnostic = async () => {
    try {
      setSimpleLoading(true)
      setSimpleError(null)
      setSimpleResult(null)

      const response = await fetch("/api/instagram/simple-diagnostic", {
        headers: {
          "x-admin-key": apiKey,
        },
      })

      const responseText = await response.text()

      try {
        const data = JSON.parse(responseText)

        if (!response.ok) {
          throw new Error(data.message || data.error || "Unknown error")
        }

        setSimpleResult(data)
      } catch (parseError) {
        console.error("Failed to parse response:", responseText)
        throw new Error(`Invalid response: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`)
      }
    } catch (err) {
      console.error("Simple diagnostic error:", err)
      setSimpleError(err.message || "An unknown error occurred")
    } finally {
      setSimpleLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instagram Diagnostic Tool</CardTitle>
        <CardDescription>Test your Instagram connection and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Admin API Key</Label>
          <Input
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your admin API key"
            type="password"
          />
        </div>

        <Tabs defaultValue="simple">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Diagnostic</TabsTrigger>
            <TabsTrigger value="full">Full Diagnostic</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4 pt-4">
            {simpleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{simpleError}</AlertDescription>
              </Alert>
            )}

            {simpleResult && (
              <div className="space-y-4">
                <Alert variant={simpleResult.status === "success" ? "success" : "warning"}>
                  {simpleResult.status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {simpleResult.status === "success" ? "Basic Check Passed" : "Basic Check Failed"}
                  </AlertTitle>
                  <AlertDescription>{simpleResult.message}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Environment Check</h3>
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[300px]">
                      {JSON.stringify(simpleResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={runSimpleDiagnostic} disabled={simpleLoading} className="w-full">
              {simpleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Basic Check...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Basic Check
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="full" className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert variant={result.status === "success" ? "success" : "warning"}>
                  {result.status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.status === "success" ? "Diagnostic Passed" : "Diagnostic Failed"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Diagnostic Details</h3>
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[300px]">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={runDiagnostic} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Full Diagnostic...
                </>
              ) : (
                "Run Full Diagnostic"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

