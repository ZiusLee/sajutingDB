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

          // Check if there's a pending saju session to link
          const sessionId = localStorage.getItem("user_id")

          if (sessionId) {
            console.log("Found pending session to link:", sessionId)

            // Link the session to the authenticated user
            const success = await updateAuthUserId(sessionId, authUserId)

            if (success) {
              console.log("Successfully linked saju session to authenticated user")
              toast({
                title: "로그인 완료",
                description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
              })

              // Check if there's pending saju data to navigate to chat
              const currentSaju = localStorage.getItem("current_saju")
              if (currentSaju) {
                console.log("Found pending saju data, navigating to chat")
                router.push("/saju-chat/sajuping")
                return
              }
            } else {
              console.error("Failed to link saju session")
              toast({
                title: "데이터 연결 실패",
                description: "사주 정보 연결에 실패했습니다.",
                variant: "destructive",
              })
            }
          }

          // Default redirect to mypage
          toast({
            title: "로그인 완료",
            description: "성공적으로 로그인되었습니다.",
          })
          router.push("/mypage")
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
