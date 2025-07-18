"use client"

import { SignInModal } from "@/components/signin-modal"

interface LoginPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export function LoginPromptDialog({ isOpen, onClose, message }: LoginPromptDialogProps) {
  return (
    <SignInModal
      isOpen={isOpen}
      onClose={onClose}
      title="지금 계정을 연동하고"
      description={message || "3초만에 사주 분석을 받아보세요."}
    />
  )
}
