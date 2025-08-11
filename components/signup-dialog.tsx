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
                <span className="font-extrabold">TALK</span>
              </ProviderCircle>

              {/* Google */}
              <ProviderCircle
                label="Google"
                bgClass="bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1f2937] border border-[#e5e7eb]"
                onClick={() => onSelectProvider("google")}
              >
                <span className="text-xl font-bold">G</span>
              </ProviderCircle>

              {/* Apple (optional, disabled for now) */}
              <ProviderCircle
                label="Apple"
                disabled
                bgClass="bg-black/90 text-white opacity-60"
                onClick={() => onSelectProvider("apple")}
              >
                <span className="text-xl font-semibold">{"\uF8FF"}</span>
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
