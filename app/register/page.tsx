import type { Metadata } from "next"
import RegisterForm from "@/components/auth/register-form"
import { requireGuest } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Register - Lazygram",
  description: "Create a new Lazygram account",
}

export default async function RegisterPage() {
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
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Enter your details to create a new Lazygram account</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

