"use client"

import { Home, MessageCircle, User, Search, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "홈",
  },
  {
    href: "/search",
    icon: Search,
    label: "검색",
  },
  {
    href: "/chat-list",
    icon: MessageCircle,
    label: "채팅",
  },
  {
    href: "/daily-fortune",
    icon: Calendar,
    label: "운세",
  },
  {
    href: "/mypage",
    icon: User,
    label: "마이페이지",
  },
]

export function BottomNavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-xs transition-colors",
                isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600",
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
