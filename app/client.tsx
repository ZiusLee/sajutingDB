"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { ChatProvider } from "@/contexts/chat-context"
import { BottomNavBar } from "@/components/bottom-nav-bar"
import { useAuth } from "@/hooks/use-auth"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isAuthenticated } = useAuth()
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 추가 메타 태그 */}
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="800" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ChatProvider>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1 pb-16">{children}</div>
                <SiteFooter />
                {isAuthenticated && <BottomNavBar />}
              </div>
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
