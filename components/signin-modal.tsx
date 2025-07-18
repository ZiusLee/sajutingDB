"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSupabase } from "@/lib/supabase-client"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  onAuthSuccess?: () => void
}

export function SignInModal({
  isOpen,
  onClose,
  title = "지금 계정을 연동하고",
  description = "3초만에 사주 분석을 받아보세요.",
  onAuthSuccess,
}: SignInModalProps) {
  const router = useRouter()
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const supabase = getSupabase()

  // Listen for auth state changes
  useEffect(() => {
    if (!isOpen) return

    console.log("Setting up auth listener in SignInModal")

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change in SignInModal:", event, session?.user?.id)

      if (event === "SIGNED_IN" && session?.user && !isProcessingAuth) {
        console.log("User signed in successfully:", session.user.id)
        setIsProcessingAuth(true)

        try {
          // Store user info in localStorage for compatibility
          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", session.user.id)
          localStorage.setItem("user_email", session.user.email || "")

          // Extract name from metadata if available
          const userName =
            session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User"
          localStorage.setItem("user_name", userName)

          // Call the success callback if provided
          if (onAuthSuccess) {
            console.log("Calling onAuthSuccess callback")
            await onAuthSuccess()
          }

          // Reset loading states
          setIsKakaoLoading(false)
          setIsGoogleLoading(false)
          setError("")
        } catch (error) {
          console.error("Error in auth success handler:", error)
          setError("인증 처리 중 오류가 발생했습니다.")
        } finally {
          setIsProcessingAuth(false)
        }
      }
    })

    return () => {
      console.log("Cleaning up auth listener")
      subscription.unsubscribe()
    }
  }, [isOpen, onAuthSuccess, supabase.auth, isProcessingAuth])

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError("")
      setIsKakaoLoading(false)
      setIsGoogleLoading(false)
      setIsProcessingAuth(false)
    }
  }, [isOpen])

  // Handle Kakao login
  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true)
    setError("")

    try {
      console.log("Starting Kakao login...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Kakao login error:", error)
        throw error
      }

      console.log("Kakao login initiated, waiting for redirect...")
      // The redirect will be handled by Supabase
    } catch (err) {
      console.error("카카오 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "카카오 로그인 중 오류가 발생했습니다.")
      setIsKakaoLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      console.log("Starting Google login...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Google login error:", error)
        throw error
      }

      console.log("Google login initiated, waiting for redirect...")
      // The redirect will be handled by Supabase
    } catch (err) {
      console.error("구글 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다.")
      setIsGoogleLoading(false)
    }
  }

  // Handle Email login - redirect to login page
  const handleEmailLogin = () => {
    onClose()
    router.push("/login?mode=email")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-4 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight">
            {title}
            <br />
            {description}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-8">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Processing message */}
          {isProcessingAuth && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                로그인 처리 중...
              </p>
            </div>
          )}

          {/* SNS LOGIN Section */}
          <div className="text-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">SNS LOGIN</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center items-center space-x-6">
            {/* Kakao Login */}
            <button
              onClick={handleKakaoLogin}
              disabled={isKakaoLoading || isGoogleLoading || isProcessingAuth}
              className="w-16 h-16 rounded-full bg-[#FEE500] flex items-center justify-center hover:bg-[#E6CF00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isKakaoLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z"
                    fill="black"
                  />
                </svg>
              )}
            </button>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={isKakaoLoading || isGoogleLoading || isProcessingAuth}
              className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
            </button>

            {/* Email Login */}
            <button
              onClick={handleEmailLogin}
              disabled={isKakaoLoading || isGoogleLoading || isProcessingAuth}
              className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Mail className="w-7 h-7 text-white" />
            </button>
          </div>

          {/* Login method labels */}
          <div className="flex justify-center items-center space-x-6 mt-3">
            <span className="w-16 text-xs text-gray-500 text-center">카카오</span>
            <span className="w-16 text-xs text-gray-500 text-center">구글</span>
            <span className="w-16 text-xs text-gray-500 text-center">이메일</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
