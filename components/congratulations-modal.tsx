"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Fireworks } from "./fireworks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CongratulationsModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export function CongratulationsModal({ isOpen = true, onClose }: CongratulationsModalProps) {
  const [open, setOpen] = useState(isOpen)
  const [showFireworks, setShowFireworks] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setOpen(isOpen)
  }, [isOpen])

  useEffect(() => {
    // 5초 후에 폭죽 효과 중지
    const timer = setTimeout(() => {
      setShowFireworks(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setOpen(false)
    if (onClose) {
      onClose()
    } else {
      router.push("/")
    }
  }

  return (
    <>
      {showFireworks && <Fireworks />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 축하합니다! 🎉</DialogTitle>
            <DialogDescription className="text-center pt-4">
              베타 서비스 신청이 성공적으로 완료되었습니다.
              <br />
              <br />
              서비스 출시 시 가장 먼저 알려드리겠습니다.
              <br />
              <br />
              <span className="font-semibold">사주핑과 함께 당신의 운명을 탐색해보세요!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={handleClose} className="w-full sm:w-auto">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
