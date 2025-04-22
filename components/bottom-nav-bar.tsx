"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar, User } from "lucide-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="container flex justify-around items-center h-16">
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-full w-full"
          onClick={() => router.push("/chatlist")}
          data-active={pathname?.includes("/chat") || pathname?.includes("/chatlist")}
        >
          <MessageSquare
            className={`h-6 w-6 ${
              pathname?.includes("/chat") || pathname?.includes("/chatlist") ? "text-primary" : ""
            }`}
          />
          <span
            className={`text-xs mt-1 ${
              pathname?.includes("/chat") || pathname?.includes("/chatlist") ? "text-primary font-medium" : ""
            }`}
          >
            채팅
          </span>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-full w-full"
          onClick={() => router.push("/")}
          data-active={pathname === "/"}
        >
          <Calendar className={`h-6 w-6 ${pathname === "/" ? "text-primary" : ""}`} />
          <span className={`text-xs mt-1 ${pathname === "/" ? "text-primary font-medium" : ""}`}>사주</span>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center h-full w-full"
          onClick={() => router.push("/mypage")}
          data-active={pathname?.includes("/mypage")}
        >
          <User className={`h-6 w-6 ${pathname?.includes("/mypage") ? "text-primary" : ""}`} />
          <span className={`text-xs mt-1 ${pathname?.includes("/mypage") ? "text-primary font-medium" : ""}`}>
            마이페이지
          </span>
        </Button>
      </div>
    </div>
  )
}
