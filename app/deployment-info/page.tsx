import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeploymentInfoPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Deployment Information</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Client-side accessible environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-md font-mono text-sm whitespace-pre">
            {`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "not set"}`}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>Test these endpoints to verify your deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>
              <a
                href="/api/test"
                target="_blank"
                className="text-blue-600 hover:underline flex items-center"
                rel="noreferrer"
              >
                /api/test - Basic API test
              </a>
            </li>
            <li>
              <a
                href="/api/debug/simple"
                target="_blank"
                className="text-blue-600 hover:underline flex items-center"
                rel="noreferrer"
              >
                /api/debug/simple - Basic environment info
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Page rendered at: {new Date().toISOString()}</p>
      </div>
    </div>
  )
}

