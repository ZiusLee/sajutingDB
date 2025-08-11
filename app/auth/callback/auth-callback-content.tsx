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

          // Check if there's an existing anonymous saju_session that needs auth_user_id update
          const sessionId = localStorage.getItem("saju_session_id")
          let linkedAnySession = false

          if (sessionId) {
            console.log("Found existing saju_session ID, updating auth_user_id:", sessionId)
            
            try {
              // Update auth_user_id for existing session
              console.log("Updating auth_user_id for session:", sessionId, "with auth user:", authUserId)
              const success = await updateAuthUserId(sessionId, authUserId)
              
              if (success) {
                console.log("Successfully updated auth_user_id for saju session:", sessionId)
                linkedAnySession = true
                
                // Clean up tempSajuData since session is now linked
                localStorage.removeItem("tempSajuData")
                
                toast({
                  title: "로그인 완료",
                  description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
                })

                // Navigate directly to chat
                router.push("/saju-chat/sajuping")
                return
              } else {
                console.error("Failed to update auth_user_id for session:", sessionId)
              }
            } catch (error) {
              console.error("Error updating session auth_user_id:", error)
            }
          }

          // Check for stored auth return URL (from saju-chat)
          const authReturnUrl = localStorage.getItem("auth_return_url")
          let redirectUrl = "/mypage" // default

          if (authReturnUrl) {
            console.log("Found auth return URL:", authReturnUrl)
            redirectUrl = authReturnUrl
            localStorage.removeItem("auth_return_url") // Clean up
          }

          // Default redirect with appropriate message
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
          
          router.push(redirectUrl)
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
