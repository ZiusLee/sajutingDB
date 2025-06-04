"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, MessageCircle, User, Sparkles } from "lucide-react"
import { shouldHideBottomNav } from "@/lib/memory-bank"

export function BottomNavBar() {
  const pathname = usePathname()

  // 🚨 MEMORY BANK RULE: 채팅 페이지에서는 하단 네비게이션 바 숨김
  if (shouldHideBottomNav(pathname)) {
    return null
  }

  const navItems = [
    {
      href: "/",
      icon: Sparkles,
      label: "사주계산",
    },
    {
      href: "/search",
      icon: Search,
      label: "검색",
    },
    {
      href: "/landing",
      icon: Home,
      label: "홈",
    },
    {
      href: "/chat-list",
      icon: MessageCircle,
      label: "채팅",
    },
    {
      href: "/mypage",
      icon: User,
      label: "마이페이지",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 min-w-[60px] ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
