"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Processing auth callback...")
        console.log("Search params:", Object.fromEntries(searchParams.entries()))

        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (error) {
          console.error("❌ OAuth error from provider:", error, errorDescription)
          router.push(`/login?error=${encodeURIComponent(error)}`)
          return
        }

        if (code) {
          console.log("✅ Auth code received, exchanging for session...")

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("❌ Session exchange error:", exchangeError)
            router.push(`/login?error=callback_error`)
            return
          }

          if (data.user) {
            console.log("✅ User authenticated:", data.user.id)

            // Store user info in localStorage
            localStorage.setItem("user_authenticated", "true")
            localStorage.setItem("user_id", data.user.id)
            if (data.user.email) {
              localStorage.setItem("user_email", data.user.email)
            }
            if (data.user.user_metadata?.name) {
              localStorage.setItem("user_name", data.user.user_metadata.name)
            }

            // Redirect to original destination
            const returnUrl = localStorage.getItem("auth_return_url") || "/mypage"
            localStorage.removeItem("auth_return_url")

            console.log("🔄 Redirecting to:", returnUrl)
            router.push(returnUrl)
          } else {
            console.error("❌ No user data received")
            router.push("/login?error=no_user")
          }
        } else {
          console.error("❌ No auth code found in callback")
          router.push("/login?error=no_code")
        }
      } catch (error) {
        console.error("❌ Auth callback error:", error)
        router.push("/login?error=callback_error")
      }
    }

    handleAuthCallback()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">인증 처리 중...</h1>
        <p className="text-white/80">잠시만 기다려주세요</p>
      </div>
    </div>
  )
}
