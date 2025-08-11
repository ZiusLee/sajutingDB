"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"
import { updateAuthUserId } from "@/lib/db-service"
import { findAndLinkSessions } from "@/lib/saju-session-service"
import { syncLocalStorageToDatabase } from "@/lib/data-sync"
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

          // Check if there's tempSajuData from onboarding flow
          const tempSajuDataStr = localStorage.getItem("tempSajuData")
          let linkedAnySession = false

          if (tempSajuDataStr) {
            console.log("Found tempSajuData from onboarding, processing...")
            
            try {
              // Save to database with authenticated user ID
              const userId = await syncLocalStorageToDatabase(authUserId)

              if (userId) {
                console.log("Successfully saved saju data with session ID:", userId)

                // Update the current_saju data with the session ID
                const currentSajuStr = localStorage.getItem("current_saju")
                if (currentSajuStr) {
                  const currentSaju = JSON.parse(currentSajuStr)
                  currentSaju.sessionId = userId
                  localStorage.setItem("current_saju", JSON.stringify(currentSaju))
                }

                localStorage.setItem("saju_session_id", userId)
                
                // Clean up temp data
                localStorage.removeItem("tempSajuData")

                toast({
                  title: "로그인 완료",
                  description: "사주 정보가 계정에 성공적으로 연결되었습니다.",
                })
                linkedAnySession = true

                // Navigate directly to chat
                router.push("/saju-chat/sajuping")
                return
              } else {
                console.error("Failed to save saju data to database")
              }
            } catch (error) {
              console.error("Error processing tempSajuData:", error)
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
