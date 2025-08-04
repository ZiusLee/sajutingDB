"use client"

import { Home, MessageCircle, User, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/saju-chat/general", icon: MessageCircle, label: "채팅" },
  { href: "/daily-fortune", icon: Calendar, label: "운세" },
  { href: "/mypage", icon: User, label: "마이페이지" },
]

export function BottomNavBar() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-sm border-t border-border",
        "pb-safe", // Safe area padding
        "md:hidden", // Only show on mobile
      )}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg",
                "min-w-[60px] touch-manipulation",
                "transition-colors duration-200",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
