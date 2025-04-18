"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get("code")

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)

          // Get user data after successful login
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (user) {
            // Store user info in localStorage if needed
            localStorage.setItem("user_authenticated", "true")
            localStorage.setItem("user_id", user.id)

            // If user has user_metadata with name, store it
            if (user.user_metadata?.name) {
              localStorage.setItem("user_name", user.user_metadata.name)
            } else if (user.email) {
              localStorage.setItem("user_name", user.email.split("@")[0])
            }

            // Redirect to home page or dashboard
            router.push("/")
          }
        } catch (error) {
          console.error("Error exchanging code for session:", error)
          router.push("/login?error=callback_error")
        }
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
