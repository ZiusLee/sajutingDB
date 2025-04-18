"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { MobileNav } from "@/components/mobile-nav"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-6 md:gap-10">
      <MobileNav />
      <nav className="hidden md:flex gap-6">
        <Link
          href="/"
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base",
            pathname === "/" ? "text-foreground" : "text-foreground/60",
          )}
        >
          홈
        </Link>
        <Link
          href="/about"
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base",
            pathname === "/about" ? "text-foreground" : "text-foreground/60",
          )}
        >
          소개
        </Link>
        <Link
          href="/chat-list"
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base",
            pathname?.startsWith("/chat") ? "text-foreground" : "text-foreground/60",
          )}
        >
          채팅
        </Link>
      </nav>
    </div>
  )
}
