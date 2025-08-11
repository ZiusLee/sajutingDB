"use client"

import type * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Provider = "kakao" | "google" | "apple"

export interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: Provider) => void
  isOverLimit?: boolean
  currentCount?: number
  maxCount?: number
}

export function SignupDialog({
  open,
  onOpenChange,
  onSelectProvider,
  isOverLimit = false,
  currentCount = 0,
  maxCount = 5,
}: SignupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl p-0 overflow-hidden">
        <div className="p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            {isOverLimit ? (
              <>
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-center">
                  게스트 이용 가능 횟수({maxCount}회)를 모두 사용하셨습니다
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground text-center leading-relaxed">
                  계속 이용하시려면 간편 로그인을 진행해주세요.
                  <br />
                  <span className="text-sm text-green-600 font-medium">
                    로그인하면 대화와 사주 기록이 안전하게 저장됩니다.
                  </span>
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
                  지금 계정을 연동하고 <span className="whitespace-nowrap">3초만에 사주 분석을 받아보세요.</span>
                </DialogTitle>
                <DialogDescription className="sr-only">카카오 또는 구글로 간편하게 로그인하세요.</DialogDescription>
              </>
            )}
          </DialogHeader>

          <div className="mt-6 sm:mt-8">
            <div className="flex items-center gap-3 text-xs tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-muted" />
              <span className="shrink-0">SNS LOGIN</span>
              <div className="h-px flex-1 bg-muted" />
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-4 sm:gap-6 place-items-center">
              {/* Kakao */}
              <ProviderButton
                label="카카오로 로그인"
                bgClass="bg-[#FEE500] hover:bg-[#E6CF00] text-black"
                onClick={() => onSelectProvider("kakao")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z"
                    fill="currentColor"
                  />
                </svg>
                카카오로 로그인
              </ProviderButton>

              {/* Google */}
              <ProviderButton
                label="구글로 로그인"
                bgClass="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                onClick={() => onSelectProvider("google")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
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
                구글로 로그인
              </ProviderButton>
            </div>

            {!isOverLimit && (
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  무료 체험 중이신가요? 남은 횟수: {Math.max(0, maxCount - currentCount)}/{maxCount}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProviderButton({
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
        "w-full h-12 px-4 rounded-lg inline-flex items-center justify-center text-sm font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
        bgClass,
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  )
}
