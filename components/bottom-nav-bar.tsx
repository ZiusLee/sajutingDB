"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Home, Search, PlusSquare, Coins, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BottomNavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("세션 확인 오류:", sessionError)
          throw sessionError // 세션 확인 실패 시 오류 발생
        }

        if (sessionData?.session) {
          setIsAuthenticated(true)
        } else {
          // Fallback to localStorage check
          const isAuth = localStorage.getItem("user_authenticated") === "true"
          setIsAuthenticated(isAuth)
        }
      } catch (error) {
        console.error("Authentication check error:", error)
        setIsAuthenticated(false)
        toast({
          title: "인증 오류",
          description: "인증 정보를 확인하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, toast])

  // Don't show on login or register pages or when not authenticated
  // 또한 채팅 관련 페이지에서도 표시하지 않음 (임시 조치)
  if (
    isLoading ||
    !isAuthenticated ||
    pathname?.includes("/login") ||
    pathname?.includes("/register") ||
    pathname?.includes("/reset-password")
  ) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around items-center h-16">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => router.push("/")}
          aria-label="홈"
        >
          <Home className={`h-6 w-6 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => router.push("/search")}
          aria-label="검색"
        >
          <Search className={`h-6 w-6 ${pathname === "/search" ? "text-primary" : "text-muted-foreground"}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => router.push("/")}
          aria-label="새 사주 입력"
        >
          <PlusSquare className="h-6 w-6 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => router.push("/daily-fortune")}
          aria-label="오늘의 운세"
        >
          <Coins className={`h-6 w-6 ${pathname === "/daily-fortune" ? "text-primary" : "text-muted-foreground"}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => router.push("/mypage")}
          aria-label="마이페이지"
        >
          <User className={`h-6 w-6 ${pathname === "/mypage" ? "text-primary" : "text-muted-foreground"}`} />
        </Button>
      </div>
    </div>
  )
}
