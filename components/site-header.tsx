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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <SajuLogo size="sm" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              소개
            </Link>
            {isAuthenticated && (
              <Link href="/mypage" className="text-sm font-medium transition-colors hover:text-primary">
                마이페이지
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <UserProfileDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                  로그인
                </Button>
                <Button size="sm" onClick={() => router.push("/register")}>
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
