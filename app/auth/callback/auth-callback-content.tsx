"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

export default function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")

    if (code) {
      // Here you would typically exchange the code for a token
      // and store it securely (e.g., in an HTTP-only cookie).
      // For this example, we'll just redirect to the landing page.
      router.push("/landing")
    } else {
      // Handle the case where the code is missing.
      console.error("Authorization code is missing.")
      router.push("/") // Redirect to the home page or an error page.
    }
  }, [searchParams, router])

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
