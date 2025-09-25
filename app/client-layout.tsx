"use client"

import type React from "react"
import { SiteHeader } from "@/components/site-header"
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
    <>
      {!shouldHideNavbar && <SiteHeader />}
      <main className={shouldHideNavbar ? "" : isScrollablePage ? "h-screen overflow-hidden" : "min-h-screen"}>
        {children}
      </main>
    </>
  )
}
