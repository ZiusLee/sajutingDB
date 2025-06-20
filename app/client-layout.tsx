"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // saju-chat 페이지에서는 navbar 숨김
  const hiddenNavbarPaths = ["/saju-chat"]
  const shouldHideNavbar = hiddenNavbarPaths.some((path) => pathname?.startsWith(path))

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <ChatProvider>
          {!shouldHideNavbar && <Navbar />}
          <main className={shouldHideNavbar ? "" : "min-h-screen"}>{children}</main>
          <Toaster />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
