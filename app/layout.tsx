import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// Add these environment variables to your .env file or Vercel project:
// INSTAGRAM_APP_ID - Your Facebook App ID
// INSTAGRAM_APP_SECRET - Your Facebook App Secret
// NEXT_PUBLIC_APP_URL - Your app's URL (e.g., https://your-app.vercel.app)



import './globals.css'