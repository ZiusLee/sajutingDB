"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, User, LogOut, Settings, MessageSquare, Calendar, Users, Home } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SajuLogo } from "@/components/saju-logo"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface SiteHeaderProps {
  showLogo?: boolean
}

export function SiteHeader({ showLogo = true }: SiteHeaderProps) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const navigation = [
    { name: "홈", href: "/", icon: Home },
    { name: "사주채팅", href: "/saju-chat/general", icon: MessageSquare },
    { name: "대운분석", href: "/daeun-analysis", icon: Calendar },
    { name: "궁합보기", href: "/compatibility", icon: Users },
    { name: "마이페이지", href: "/mypage", icon: User },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  // Don't render on the landing page
  if (pathname === "/") {
    return null
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        {showLogo && (
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <SajuLogo className="h-8 w-8" />
              <span className="hidden sm:inline-block font-bold text-lg">사주핑</span>
            </button>
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </button>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || ""} alt={user.username || ""} />
                      <AvatarFallback>
                        {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username || user.email}</p>
                      {user.email && user.username && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation("/mypage")}>
                    <User className="mr-2 h-4 w-4" />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="md:hidden p-0 w-10 h-10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <SajuLogo className="h-6 w-6" />
                        <span className="font-bold text-lg">사주핑</span>
                      </div>
                    </div>

                    <nav className="flex flex-col space-y-3 flex-1">
                      {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.href)}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                              isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </button>
                        )
                      })}
                    </nav>

                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center space-x-3 px-3 py-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} alt={user.username || ""} />
                          <AvatarFallback>
                            {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.username || user.email}</span>
                          {user.email && user.username && (
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  로그인
                </Button>
                <Button onClick={() => router.push("/register")}>회원가입</Button>
              </div>
              <div className="sm:hidden">
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  로그인
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
