"use client"

import { usePathname } from "next/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  const isSajuChat = pathname?.includes("/saju-chat/")

  return (
    <header className="fixed top-0 z-50 w-full">
      <div
        className={`container flex h-16 lg:h-20 items-center justify-between px-4 sm:px-6 lg:px-8 ${isSajuChat ? "hidden" : ""}`}
      >
        <div>Site Header</div>
      </div>
    </header>
  )
}
