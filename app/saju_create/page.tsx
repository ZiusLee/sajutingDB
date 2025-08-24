"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SajuCreateFlow } from "@/components/saju-create-flow"
import { Loader2 } from "lucide-react"

export default function SajuCreatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          // Not authenticated, redirect to login
          router.push("/login")
          return
        }

        setIsAuthenticated(true)

        // Check if user already has saju sessions
        const { data: existingSessions, error } = await supabase
          .from("saju_sessions")
          .select("id")
          .eq("auth_user_id", session.user.id)
          .limit(1)

        if (error) {
          console.error("Error checking existing sessions:", error)
        } else if (existingSessions && existingSessions.length > 0) {
          // User already has saju sessions, redirect to chat
          console.log("User already has saju sessions, redirecting to chat")
          router.push("/saju-chat/sajuping")
          return
        }

        // User is authenticated but has no saju sessions, show create flow
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.push("/login")
      }
    }

    checkAuthAndRedirect()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return <SajuCreateFlow />
}
