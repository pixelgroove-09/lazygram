"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Instagram, LayoutDashboard, Upload, Calendar, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import LogoutButton from "@/components/auth/logout-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppLayoutProps {
  children: ReactNode
  user: {
    id: string
    email: string
    user_metadata?: {
      name?: string
    }
  } | null
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { name: "Upload", href: "/upload", icon: <Upload className="h-4 w-4 mr-2" /> },
    { name: "Schedule", href: "/schedule", icon: <Calendar className="h-4 w-4 mr-2" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="h-4 w-4 mr-2" /> },
  ]

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User"
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header - only shown when user is logged in */}
      {user && (
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" alt={userName} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton variant="ghost" className="w-full justify-start cursor-pointer" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </header>
      )}

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

