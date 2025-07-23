"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface BackNavigationErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  onGoHome: () => void
  onLogin: () => void
}

export function BackNavigationErrorDialog({ isOpen, onClose, onGoHome, onLogin }: BackNavigationErrorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-900 border-white/20 text-white">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>데이터 손실 경고</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-white/80">
            뒤로가기 중 오류가 발생했습니다.
            <br />
            <span className="text-yellow-400 font-medium">현재 채팅 데이터가 손실될 수 있습니다.</span>
            <br />
            <br />
            로그인하시면 채팅 기록이 자동으로 저장되어 언제든지 다시 확인할 수 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onGoHome}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            홈페이지로 돌아가기
          </AlertDialogCancel>
          <AlertDialogAction onClick={onLogin} className="bg-purple-600 hover:bg-purple-700 text-white">
            로그인하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
