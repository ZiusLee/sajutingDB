"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: "kakao" | "google") => void
}

export function SignupDialog({ open, onOpenChange, onSelectProvider }: SignupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<"kakao" | "google" | null>(null)

  const handleProviderSelect = async (provider: "kakao" | "google") => {
    setIsLoading(true)
    setSelectedProvider(provider)

    try {
      await onSelectProvider(provider)
    } catch (error) {
      console.error("Provider selection error:", error)
    } finally {
      setIsLoading(false)
      setSelectedProvider(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-3xl p-8 border-0 shadow-2xl">
        <div className="text-center space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">지금 계정을 연동하고</h2>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">3초만에 사주 분석을 받아보세</h2>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">요.</h2>
          </div>

          {/* SNS LOGIN Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-6 text-sm font-medium text-gray-500 tracking-wider">SNS LOGIN</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-12">
              {/* Kakao Button */}
              <button
                onClick={() => handleProviderSelect("kakao")}
                disabled={isLoading}
                className="w-20 h-20 rounded-full bg-[#FEE500] hover:bg-[#FADA0A] transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && selectedProvider === "kakao" ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#3C1E1E]" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    {/* Chat Bubble Icon */}
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#3C1E1E]"
                    >
                      <path
                        d="M16 4C9.373 4 4 8.925 4 15c0 3.074 1.676 5.825 4.192 7.622-.096.667-.319 2.149-.96 3.863-.128.342.213.683.555.555 1.714-.641 3.196-.864 3.863-.96C13.175 27.324 15.926 28 19 28c6.627 0 12-4.925 12-11S22.627 4 16 4z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* Google Button */}
              <button
                onClick={() => handleProviderSelect("google")}
                disabled={isLoading}
                className="w-20 h-20 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && selectedProvider === "google" ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    {/* Google G Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
