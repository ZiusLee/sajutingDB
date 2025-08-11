"use client"

import type * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Provider = "kakao" | "google" | "apple"

export interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: Provider) => void
}

export function SignupDialog({ open, onOpenChange, onSelectProvider }: SignupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
              지금 계정을 연동하고 <span className="whitespace-nowrap">3초만에 사주 분석을 받아보세요.</span>
            </DialogTitle>
            <DialogDescription className="sr-only">카카오 또는 구글로 간편하게 로그인하세요.</DialogDescription>
          </DialogHeader>

          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-3 text-xs tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-muted" />
              <span className="shrink-0">SNS LOGIN</span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-4 sm:gap-6 place-items-center">
              {/* Kakao */}
              <ProviderCircle
                label="Kakao"
                bgClass="bg-[#FEE500] hover:bg-[#E6CF00] text-black"
                onClick={() => onSelectProvider("kakao")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z"
                    fill="currentColor"
                  />
                </svg>
              </ProviderCircle>

              {/* Google */}
              <ProviderCircle
                label="Google"
                bgClass="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                onClick={() => onSelectProvider("google")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              </ProviderCircle>

              {/* Apple (optional, disabled for now) */}
              <ProviderCircle
                label="Apple"
                disabled
                bgClass="bg-black/90 text-white opacity-60"
                onClick={() => onSelectProvider("apple")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </ProviderCircle>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProviderCircle({
  children,
  label,
  onClick,
  bgClass,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  bgClass?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-20 sm:size-24 rounded-full inline-flex items-center justify-center shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
        bgClass,
        disabled && "cursor-not-allowed",
      )}
    >
      {children}
    </button>
  )
}
