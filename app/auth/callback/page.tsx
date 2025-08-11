"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("인증 처리 중...")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Processing auth callback...")

        // URL에서 인증 코드 처리
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Auth callback error:", error)
          setStatus("인증 처리 중 오류가 발생했습니다.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        if (data.session?.user) {
          console.log("✅ User authenticated:", data.session.user.id)
          setStatus("로그인 성공! 잠시만 기다려주세요...")

          // 세션 연결 처리
          const pendingSessionId = localStorage.getItem("pending_session_link")
          if (pendingSessionId) {
            console.log(`🔗 Linking pending session ${pendingSessionId}`)

            const { error: linkError } = await supabase
              .from("saju_sessions")
              .update({ auth_user_id: data.session.user.id })
              .eq("id", pendingSessionId)
              .eq("auth_user_id", null)

            if (linkError) {
              console.error("❌ Error linking session:", linkError)
            } else {
              console.log("✅ Successfully linked session")
              localStorage.removeItem("pending_session_link")
              localStorage.removeItem("anonymous_session_created")
            }
          }

          // 원래 URL로 리다이렉션
          const returnUrl = localStorage.getItem("auth_return_url")
          if (returnUrl) {
            console.log("🔄 Redirecting to:", returnUrl)
            localStorage.removeItem("auth_return_url")
            window.location.href = returnUrl
          } else {
            console.log("🔄 Redirecting to saju chat")
            router.push("/saju-chat/sajuping")
          }
        } else {
          console.log("❌ No user session found")
          setStatus("인증에 실패했습니다.")
          setTimeout(() => router.push("/"), 3000)
        }
      } catch (error) {
        console.error("❌ Auth callback error:", error)
        setStatus("인증 처리 중 오류가 발생했습니다.")
        setTimeout(() => router.push("/"), 3000)
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900">{status}</p>
        <p className="text-sm text-gray-500 mt-2">페이지를 새로고침하지 마세요.</p>
      </div>
    </div>
  )
}
