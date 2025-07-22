"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, History, ArrowRight, X } from "lucide-react"

interface ChatGuideModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export function ChatGuideModal({ isOpen, onClose, userName }: ChatGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "새로운 대화가 시작됩니다! 🎉",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">새 채팅방</h4>
              <p className="text-sm text-blue-700">같은 사주정보를 바탕으로 새로운 채팅방이 열립니다</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">💡 알아두세요:</p>
            <p>• 첫 번째 메시지를 보내야 대화가 저장됩니다</p>
            <p>• 이 사주정보로 했던 과거 채팅방은 사이드바에서 확인하고 이어서 대화할 수 있습니다</p>
            <p>• 언제든지 새로운 대화를 시작할 수 있습니다</p>
          </div>
        </div>
      ),
    },
    {
      title: "과거 대화 기록을 확인하세요 📚",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <History className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">사이드바 메뉴</h4>
              <p className="text-sm text-green-700">왼쪽 사이드바에서 이전 대화 기록을 확인할 수 있습니다</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 📱 모바일: 상단 메뉴 버튼을 눌러 사이드바 열기</p>
            <p>• 💻 데스크톱: 왼쪽 사이드바에서 바로 확인</p>
            <p>• 🔄 언제든지 새로운 대화를 시작할 수 있습니다</p>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{steps[currentStep].title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">{steps[currentStep].content}</div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} className="text-sm">
              건너뛰기
            </Button>
            <Button onClick={handleNext} className="text-sm">
              {currentStep < steps.length - 1 ? (
                <>
                  다음 <ArrowRight className="ml-1 h-3 w-3" />
                </>
              ) : (
                "시작하기"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
