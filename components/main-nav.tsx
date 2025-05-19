"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { MobileNav } from "@/components/mobile-nav"

export function MainNav() {
  const pathname = usePathname()

  const items = [
    {
      title: "홈",
      href: "/",
    },
    {
      title: "사주핑 스토리",
      href: "/about",
    },
  ]

  return (
    <div className="flex gap-6 md:gap-10">
      <MobileNav />
      <nav className="hidden md:flex gap-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base",
              pathname === item.href ? "text-foreground" : "text-foreground/60",
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
