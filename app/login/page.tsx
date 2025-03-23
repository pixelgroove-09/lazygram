import type { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"
import { requireGuest } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Login - Lazygram",
  description: "Login to your Lazygram account",
}

export default async function LoginPage() {
  // Redirect to dashboard if already logged in
  await requireGuest()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center">
            <Instagram className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Lazygram</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>Enter your email and password to access your Lazygram account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

