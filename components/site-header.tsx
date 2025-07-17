"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SajuLogo } from "@/components/saju-logo"
import UserProfileDropdown from "@/components/user-profile-dropdown"
import { useAuth } from "@/hooks/use-auth"

export function SiteHeader() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="container flex h-16 lg:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <SajuLogo className="lg:hidden" />
            <span className="hidden lg:inline font-bold text-xl tracking-tight">SAJUPING</span>
          </Link>
        </div>

        {/* Right side - Login/Profile */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <UserProfileDropdown user={user} />
          ) : (
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-4 lg:px-6 py-2 text-sm lg:text-base font-medium"
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
