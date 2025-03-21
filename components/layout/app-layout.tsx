"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Instagram, LayoutDashboard, Upload, Calendar, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { name: "Upload", href: "/upload", icon: <Upload className="h-4 w-4 mr-2" /> },
    { name: "Schedule", href: "/schedule", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="h-4 w-4 mr-2" /> },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center">
            <Instagram className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold">Lazygram</h1>
          </Link>

          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button variant={pathname === item.href ? "default" : "ghost"} size="sm" className="hidden md:flex">
                  {item.icon}
                  {item.name}
                </Button>
                <Button variant={pathname === item.href ? "default" : "ghost"} size="icon" className="md:hidden">
                  {item.icon}
                </Button>
              </Link>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-red-500 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto py-6 px-4">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lazygram. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

