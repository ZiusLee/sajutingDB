"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import Image from "next/image"

interface FloatingChatButtonProps {
  defaultProfile?: any
}

export default function FloatingChatButton({ defaultProfile }: FloatingChatButtonProps) {
  const [showChat, setShowChat] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSendMessage = () => {
    if (!message.trim()) return

    // 메시지와 함께 채팅방으로 ���동
    const encodedMessage = encodeURIComponent(message)
    router.push(`/saju-chat/general?message=${encodedMessage}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-md border border-white/50 shadow-lg animate-bounce"
          style={{
            animation: showChat ? "none" : "bounce 2s infinite",
          }}
        >
          <div className="relative">
            <Image src="/images/sajuping_character.png" alt="사주핑" width={40} height={40} className="rounded-full" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </Button>
      </div>

      {/* 채팅 입력 필드 */}
      {showChat && (
        <div className="fixed bottom-44 right-4 w-80 bg-white/20 backdrop-blur-md rounded-2xl p-4 z-50 border border-white/30 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Image
                src="/images/sajuping_character.png"
                alt="사주핑"
                width={24}
                height={24}
                className="rounded-full"
              />
              <p className="text-white font-medium">사주핑에게 물어보세요</p>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="질문을 입력하세요..."
              className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-white/30 hover:bg-white/40 text-white border-white/50 px-3"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-white/60">Enter 키를 눌러서 빠르게 전송하세요</div>
        </div>
      )}
    </>
  )
}
