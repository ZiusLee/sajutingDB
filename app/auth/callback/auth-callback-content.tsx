"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useUser } from "@/context/UserContext"

const AuthCallbackContent = () => {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const { setUser } = useUser()

  const findAndLinkSessions = async () => {
    // Placeholder for session linking logic
    return { success: true, linkedCount: 0 }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)

        // 세션 연결 로직
        try {
          const pendingSessionId = localStorage.getItem("pending_session_link")
          if (pendingSessionId) {
            console.log(`Linking pending session ${pendingSessionId} to user ${session.user.id}`)

            const { error } = await supabase
              .from("saju_sessions")
              .update({ auth_user_id: session.user.id })
              .eq("id", pendingSessionId)
              .eq("auth_user_id", null)

            if (error) {
              console.error("Error linking pending session:", error)
            } else {
              console.log(`Successfully linked pending session ${pendingSessionId}`)
              localStorage.removeItem("pending_session_link")
              localStorage.removeItem("anonymous_session_created")
            }
          }

          // 일반적인 세션 연결
          const { success, linkedCount } = await findAndLinkSessions()
          if (success && linkedCount > 0) {
            console.log(`Successfully linked ${linkedCount} sessions to user`)
          }
        } catch (error) {
          console.error("Error linking sessions:", error)
        }

        // 리다이렉션 로직
        const authReturnAction = localStorage.getItem("auth_return_action")
        const pendingSajuData = localStorage.getItem("auth_pending_saju_data")

        if (authReturnAction === "continue_to_chat" && pendingSajuData) {
          // onboarding에서 온 경우: chat으로 직접 이동
          console.log("Redirecting to chat after onboarding completion")
          localStorage.removeItem("auth_return_action")
          localStorage.removeItem("auth_pending_saju_data")
          router.push("/saju-chat/sajuping")
          return
        }

        // 기존 리다이렉션 로직
        const returnUrl = localStorage.getItem("auth_return_url")
        if (returnUrl && returnUrl !== window.location.href) {
          localStorage.removeItem("auth_return_url")
          window.location.href = returnUrl
          return
        }

        router.push("/")
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return null
}

export default AuthCallbackContent
