"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { SajuLogo } from "./saju-logo"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function SiteHeader() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        // First check if we have a session
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          // If we have a session, get the user
          const { data } = await supabase.auth.getUser()
          if (data?.user) {
            setUser(data.user)
            // Get user name from localStorage if available
            const storedName = localStorage.getItem("user_name")
            setUserName(storedName || data.user.email?.split("@")[0] || "사용자")
          }
        } else {
          // No session, user is not logged in (this is normal)
          setUser(null)
        }
      } catch (err) {
        // Only log actual errors, not "no session" cases
        if (!(err instanceof Error && err.message.includes("Auth session missing"))) {
          console.error("Unexpected error:", err)
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        const storedName = localStorage.getItem("user_name")
        setUserName(storedName || session.user.email?.split("@")[0] || "사용자")
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Function to navigate to mypage
  const goToMyPage = () => {
    console.log("Navigating to mypage")
    router.push("/mypage")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 sm:h-16 items-center px-3 sm:px-6 lg:px-8 space-x-2 sm:space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-2 sm:gap-6 md:gap-10 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <SajuLogo size="sm" showText={false} />
            <span className="font-bold text-lg text-primary dark:text-white">사주핑</span>
          </Link>
          <MainNav />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {/*
  {isLoading ? (
    // Show loading state
    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
  ) : user ? (
    // Profile avatar - using Button instead of Link for better click handling
    <Button
      variant="ghost"
      className="p-0 h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
      onClick={goToMyPage}
      aria-label="마이페이지"
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </Button>
  ) : (
    <Button variant="default" onClick={() => router.push("/login")}>
      로그인/회원가입
    </Button>
  )}
  */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
