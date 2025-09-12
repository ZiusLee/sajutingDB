"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/site-header"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import { usePathname } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // 더 이상 헤더를 숨기지 않음
  const hiddenNavbarPaths: string[] = []
  const shouldHideNavbar = hiddenNavbarPaths.some((path) => pathname?.startsWith(path))

  const isPrivacyPage = pathname === "/privacy"
  const isAccountDeletionPage = pathname === "/accountdeletion"
  const isScrollablePage = isPrivacyPage || isAccountDeletionPage

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <ChatProvider>
          {!shouldHideNavbar && <SiteHeader />}
          <main className={shouldHideNavbar ? "" : isScrollablePage ? "h-screen overflow-hidden" : "min-h-screen"}>
            {children}
          </main>
          <Toaster />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
