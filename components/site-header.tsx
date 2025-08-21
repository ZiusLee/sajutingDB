"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SajuLogo } from "@/components/saju-logo"
import { useAuth } from "@/hooks/use-auth"
import { SettingsDialog } from "@/components/settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're in saju chat or mypage
  const isSajuChat = pathname?.includes("/saju-chat/")

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Only hide/show if scrolled more than 10px to avoid jitter
      if (Math.abs(currentScrollY - lastScrollY) < 10) return

      setIsScrollingDown(currentScrollY > lastScrollY && currentScrollY > 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY, isMobile])

  const handleLogoClick = () => {
    if (isSajuChat) {
      // In saju chat: trigger sidebar toggle
      if (typeof window !== "undefined" && (window as any).toggleSajuChatSidebar) {
        ;(window as any).toggleSajuChatSidebar()
      }
    } else {
      // Normal behavior: navigate to home
      router.push("/")
    }
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-transparent">
      <div className="flex h-16 lg:h-20 items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          {isSajuChat ? (
            <button
              onClick={handleLogoClick}
              className={`flex items-center space-x-2 hover:opacity-80 transition-all duration-300 ${
                isMobile && isScrollingDown
                  ? "lg:opacity-100 opacity-0 translate-y-[-10px]"
                  : "opacity-100 translate-y-0"
              }`}
            >
              <Menu className="h-6 w-6 lg:hidden" />
            </button>
          ) : (
            // Normal behavior: Logo links to home
            <Link href="/" className="flex items-center space-x-2">
              <SajuLogo className="lg:hidden" />
              <span className="hidden lg:inline font-bold text-xl tracking-tight">SAJUPING</span>
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Settings button for logged-in users */}
          {isAuthenticated && (
            <SettingsDialog>
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 p-0 hover:opacity-80 rounded-full border border-gray-200 hover:border-gray-300 transition-all duration-300 ${
                  isMobile && isScrollingDown
                    ? "lg:opacity-100 opacity-0 translate-y-[-10px]"
                    : "opacity-100 translate-y-0"
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                    alt="프로필 사진"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {user?.user_metadata?.name?.charAt(0)?.toUpperCase() ||
                      user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </SettingsDialog>
          )}

          {/* Login button for non-logged-in users */}
          {!isAuthenticated && (
            <Button
              className={`bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-3 sm:px-4 lg:px-6 py-2 text-sm lg:text-base font-medium transition-all duration-300 ${
                isMobile && isScrollingDown
                  ? "lg:opacity-100 opacity-0 translate-y-[-10px]"
                  : "opacity-100 translate-y-0"
              }`}
              onClick={() => router.push("/login")}
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
