"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TermsDialog } from "@/components/terms-dialog"
import { toast } from "sonner"

export default function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [providerLabel, setProviderLabel] = useState("")
  const [isProcessing, setIsProcessing] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code")
        
        if (code) {
          // Supabase will automatically handle the auth callback
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error("Auth error:", error)
            toast.error("로그인 중 오류가 발생했습니다.")
            router.push("/")
            return
          }

          if (data.user) {
            setUser(data.user)
            
            // Determine provider label
            const provider = data.user.app_metadata?.provider || "unknown"
            setProviderLabel(provider === "google" ? "Google" : provider === "kakao" ? "Kakao" : provider)
            
            // Check if user needs to agree to terms
            const { data: sessionData } = await supabase
              .from("saju_sessions")
              .select("privacy")
              .eq("auth_user_id", data.user.id)
              .single()

            if (sessionData?.privacy === true) {
              // User already agreed to terms, redirect to continue
              redirectToOriginalDestination()
            } else {
              // Show terms dialog
              setShowTermsDialog(true)
              setIsProcessing(false)
            }
          }
        } else {
          console.error("No auth code found")
          router.push("/")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        toast.error("인증 처리 중 오류가 발생했습니다.")
        router.push("/")
      }
    }

    handleAuthCallback()
  }, [searchParams, router, supabase])

  const handleTermsAgree = async () => {
    if (!user) return

    try {
      setIsProcessing(true)
      
      // Get the current session from localStorage
      const sessionId = localStorage.getItem("current_session_id") || 
                       localStorage.getItem("user_id") ||
                       user.id

      // Update saju_sessions table
      const { error } = await supabase
        .from("saju_sessions")
        .upsert({
          id: sessionId,
          auth_user_id: user.id,
          privacy: true,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Error updating saju_sessions:", error)
        toast.error("사용자 정보 업데이트 중 오류가 발생했습니다.")
        return
      }

      setShowTermsDialog(false)
      toast.success("회원가입이 완료되었습니다!")
      
      // Redirect to original destination
      redirectToOriginalDestination()
      
    } catch (error) {
      console.error("Terms agreement error:", error)
      toast.error("약관 동의 처리 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
    }
  }

  const redirectToOriginalDestination = () => {
    // Try to get the original destination from URL params or localStorage
    const returnUrl = searchParams.get("returnUrl") || 
                     localStorage.getItem("auth_return_url") ||
                     "/saju-chat/sajuping"

    localStorage.removeItem("auth_return_url")
    router.push(returnUrl)
  }

  if (showTermsDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        <TermsDialog
          open={showTermsDialog}
          onOpenChange={setShowTermsDialog}
          providerLabel={providerLabel}
          onAgree={handleTermsAgree}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isProcessing ? "인증 처리 중..." : "회원가입 완료!"}
        </h1>
        <p className="text-white/80">잠시만 기다려주세요</p>
      </div>
    </div>
  )
}
