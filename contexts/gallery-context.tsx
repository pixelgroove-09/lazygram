"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface GalleryContextType {
  refreshTrigger: number
  refreshGallery: () => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshGallery = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return <GalleryContext.Provider value={{ refreshTrigger, refreshGallery }}>{children}</GalleryContext.Provider>
}

export function useGallery() {
  const context = useContext(GalleryContext)
  if (context === undefined) {
    throw new Error("useGallery must be used within a GalleryProvider")
  }
  return context
}

