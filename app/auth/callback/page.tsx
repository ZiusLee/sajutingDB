"use client"

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")

    if (code) {
      // Here you would typically exchange the code for a token
      // and store it securely (e.g., in an HTTP-only cookie).
      // For this example, we'll just redirect to the landing page.

      // 기존의 router.push("/mypage") 또는 router.replace("/mypage") 부분을 다음으로 변경:
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

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">로딩 중...</h1>
            <p className="text-white/80">잠시만 기다려주세요</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
