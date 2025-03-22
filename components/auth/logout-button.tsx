"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, type ButtonProps } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { logoutUser } from "@/app/actions/auth-actions"
import { toast } from "@/components/ui/use-toast"

interface LogoutButtonProps extends ButtonProps {
  showIcon?: boolean
  children?: React.ReactNode
}

export default function LogoutButton({ showIcon = true, children, ...props }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const result = await logoutUser()

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Redirect to login page
      router.push("/login")
      router.refresh()
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} {...props}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4 mr-2" />}
          {children || "Logout"}
        </>
      )}
    </Button>
  )
}

