"use client"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SajuLogo } from "@/components/saju-logo"
import { useAuth } from "@/hooks/use-auth"
import { SettingsDialog } from "@/components/settings-dialog"
import { User } from "lucide-react"
import { PanelLeft } from "lucide-react"

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're in saju chat or mypage
  const isSajuChat = pathname?.includes("/saju-chat/")
  //const isMyPage = pathname === "/mypage"

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
    <header className="fixed top-0 z-50 w-full">
      <div className="flex h-16 lg:h-20 items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          {isSajuChat ? (
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="md:hidden">
                <PanelLeft className="h-6 w-6" />
              </div>
              <SajuLogo className="hidden md:block" />
              <span className="hidden lg:inline font-bold text-xl tracking-tight">SAJUPING</span>
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
                className="h-8 w-8 lg:h-10 lg:w-10 bg-black hover:bg-gray-800 text-white"
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </SettingsDialog>
          )}

          {/* Login button for non-logged-in users */}
          {!isAuthenticated && (
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-3 sm:px-4 lg:px-6 py-2 text-sm lg:text-base font-medium"
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
