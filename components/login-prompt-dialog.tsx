"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LoginPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export function LoginPromptDialog({ isOpen, onClose, message }: LoginPromptDialogProps) {
  // Navigate to login page
  const handleLogin = () => {
    window.location.href = "/login"
  }

  // Continue without login
  const handleContinue = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>로그인 안내</DialogTitle>
          <DialogDescription>
            {message || "로그인하시면 사주 데이터와 채팅 ���역이 저장되어 언제든지 다시 확인하실 수 있습니다."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleContinue}>
            나중에 하기
          </Button>
          <Button onClick={handleLogin}>로그인하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
