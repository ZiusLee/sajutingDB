"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"
import { updateAuthUserId } from "@/lib/db-service"
import { toast } from "@/hooks/use-toast"

export default function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabase()

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          toast({
            title: "로그인 실패",
            description: "로그인 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        if (data.session?.user) {
          const authUserId = data.session.user.id
          console.log("Auth callback successful, user ID:", authUserId)

          const authReturnAction = localStorage.getItem("auth_return_action")
          const pendingSajuData = localStorage.getItem("auth_pending_saju_data")
          const pendingSessionId = localStorage.getItem("pending_session_link")
          const authFlowType = localStorage.getItem("auth_flow_type")
          const isSignupFlow = authReturnAction === "continue_to_chat" || authFlowType === "signup"
          const isLoginFlow = authFlowType === "login"

          console.log("Auth callback state:", {
            authReturnAction,
            hasPendingSajuData: !!pendingSajuData,
            pendingSessionId,
            authFlowType,
            isSignupFlow,
            isLoginFlow,
          })

          if (isLoginFlow || (!isSignupFlow && !pendingSajuData)) {
            console.log("This is a login flow, checking if user exists in our database")

            try {
              const { data: existingUser, error: userCheckError } = await supabase
                .from("saju_sessions")
                .select("id")
                .eq("auth_user_id", authUserId)
                .limit(1)

              if (userCheckError) {
                console.error("Error checking existing user:", userCheckError)
              } else if (!existingUser || existingUser.length === 0) {
                console.log("User not found in our system, redirecting to signup")
                toast({
                  title: "계정을 찾을 수 없습니다",
                  description: "먼저 사주 프로필을 생성해주세요.",
                  variant: "destructive",
                })

                // Sign out the user since they need to go through onboarding
                await supabase.auth.signOut()
                localStorage.removeItem("auth_flow_type")

                setTimeout(() => {
                  router.push("/?showOnboarding=true")
                }, 2000)
                return
              } else {
                console.log("Existing user found, proceeding with login")
              }
            } catch (error) {
              console.error("Error checking user existence:", error)
            }
          }

          if (isSignupFlow && pendingSajuData && pendingSessionId) {
            console.log("Processing onboarding completion flow (signup)")

            try {
              // 1. Update the saju_session with auth_user_id
              console.log("Updating auth_user_id for session:", pendingSessionId, "with auth user:", authUserId)
              const success = await updateAuthUserId(pendingSessionId, authUserId)

              if (success) {
                console.log("Successfully updated auth_user_id for saju session:", pendingSessionId)

                // 2. Update current_saju data with auth_user_id
                const sajuData = JSON.parse(pendingSajuData)
                sajuData.userId = authUserId
                sajuData.authUserId = authUserId
                sajuData.sessionId = pendingSessionId

                // 3. Store updated saju data
                localStorage.setItem("current_saju", JSON.stringify(sajuData))
                localStorage.setItem("saju_session_id", pendingSessionId)

                // 4. Clean up temporary flags
                localStorage.removeItem("auth_return_action")
                localStorage.removeItem("auth_pending_saju_data")
                localStorage.removeItem("pending_session_link")
                localStorage.removeItem("anonymous_session_created")
                localStorage.removeItem("tempSajuData")
                localStorage.removeItem("auth_flow_type")

                // 5. Set user authentication flags
                localStorage.setItem("user_authenticated", "true")
                localStorage.setItem("user_id", authUserId)
                if (data.session.user.user_metadata?.name) {
                  localStorage.setItem("user_name", data.session.user.user_metadata.name)
                }
                if (data.session.user.email) {
                  localStorage.setItem("user_email", data.session.user.email)
                }

                console.log("All data prepared, redirecting to chat...")

                toast({
                  title: "회원가입 완료",
                  description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
                })

                // 6. Wait a bit for state to settle, then redirect
                setTimeout(() => {
                  console.log("Redirecting to chat after onboarding completion")
                  window.location.href = "/saju-chat/sajuping"
                }, 1000)
                return
              } else {
                console.error("Failed to update auth_user_id for session:", pendingSessionId)
                toast({
                  title: "세션 연결 실패",
                  description: "사주 정보 연결에 실패했습니다.",
                  variant: "destructive",
                })
              }
            } catch (error) {
              console.error("Error in onboarding completion flow:", error)
              toast({
                title: "오류 발생",
                description: "회원가입 처리 중 오류가 발생했습니다.",
                variant: "destructive",
              })
            }
          }

          const sessionId = localStorage.getItem("saju_session_id")
          let linkedAnySession = false

          if (sessionId && sessionId !== pendingSessionId) {
            console.log("Found existing saju_session ID, updating auth_user_id:", sessionId)

            try {
              // Update auth_user_id for existing session
              console.log("Updating auth_user_id for session:", sessionId, "with auth user:", authUserId)
              const success = await updateAuthUserId(sessionId, authUserId)

              if (success) {
                console.log("Successfully updated auth_user_id for saju session:", sessionId)
                linkedAnySession = true

                // Update current_saju data if it exists
                const currentSaju = localStorage.getItem("current_saju")
                if (currentSaju) {
                  const sajuData = JSON.parse(currentSaju)
                  sajuData.userId = authUserId
                  sajuData.authUserId = authUserId
                  localStorage.setItem("current_saju", JSON.stringify(sajuData))
                }

                // Clean up tempSajuData since session is now linked
                localStorage.removeItem("tempSajuData")

                toast({
                  title: "로그인 완료",
                  description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
                })

                // Check for stored auth return URL (from saju-chat) to return to exact same room
                const authReturnUrl = localStorage.getItem("auth_return_url")
                if (authReturnUrl) {
                  console.log("Returning to original chat room:", authReturnUrl)
                  localStorage.removeItem("auth_return_url")
                  window.location.href = authReturnUrl
                } else {
                  // Fallback: Navigate to generic chat
                  window.location.href = "/saju-chat/sajuping"
                }
                return
              } else {
                console.error("Failed to update auth_user_id for session:", sessionId)
              }
            } catch (error) {
              console.error("Error updating session auth_user_id:", error)
            }
          }

          const authReturnUrl = localStorage.getItem("auth_return_url")
          let redirectUrl = "/mypage" // default

          if (authReturnUrl) {
            console.log("Found auth return URL:", authReturnUrl)
            redirectUrl = authReturnUrl
            localStorage.removeItem("auth_return_url") // Clean up
          }

          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", authUserId)
          if (data.session.user.user_metadata?.name) {
            localStorage.setItem("user_name", data.session.user.user_metadata.name)
          }
          if (data.session.user.email) {
            localStorage.setItem("user_email", data.session.user.email)
          }

          if (linkedAnySession) {
            toast({
              title: "로그인 완료",
              description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
            })
          } else {
            toast({
              title: "로그인 완료",
              description: "성공적으로 로그인되었습니다.",
            })
          }

          window.location.href = redirectUrl
        } else {
          console.log("No session found after auth callback")
          router.push("/")
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        toast({
          title: "로그인 오류",
          description: "로그인 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">로그인 처리가 완료되었습니다.</p>
      </div>
    </div>
  )
}
