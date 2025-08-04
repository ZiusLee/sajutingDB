"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { BottomNavBar } from "./bottom-nav-bar"

interface MobilePageWrapperProps {
  children: ReactNode
  className?: string
  showBottomNav?: boolean
  fullHeight?: boolean
}

export function MobilePageWrapper({
  children,
  className,
  showBottomNav = true,
  fullHeight = false,
}: MobilePageWrapperProps) {
  return (
    <>
      <div
        className={cn(
          "w-full",
          fullHeight && "min-h-screen-mobile",
          showBottomNav && "pb-20 md:pb-0", // Add bottom padding for nav on mobile
          "mobile-scroll",
          className,
        )}
      >
        {children}
      </div>
      {showBottomNav && <BottomNavBar />}
    </>
  )
}
