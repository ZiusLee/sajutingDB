"use client"

import { User, Send, Coins, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from "ai/react"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface Props {
  userId: string
  userCoins: number
}

export default function SajuChat({ userId, userCoins }: Props) {
  const router = useRouter()
  const chatRef = useRef<HTMLDivElement>(null)
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      userId,
    },
  })

  useEffect(() => {
    // Scroll to bottom when messages change
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 py-2 px-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-lg font-semibold">사주 상담</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-700">{userCoins}핑</span>
            </div>

            {/* 코인 충전소 버튼 추가 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/coin-shop")}
              className="flex items-center gap-1 text-xs"
            >
              <CreditCard className="w-4 h-4" />
              충전
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/mypage")}
              className="flex items-center gap-1 text-xs"
            >
              <User className="w-4 h-4" />
              마이페이지
            </Button>
          </div>
        </div>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="flex items-start gap-2">
              {message.role === "user" ? (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/avatars/01.png" />
                    <AvatarFallback>HS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">나</p>
                    <p className="text-sm text-gray-800">{message.content}</p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/avatars/02.png" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">점신</p>
                    <p className="text-sm text-gray-800">{message.content}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="container flex items-center gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? "문의 중..." : "문의하기"}
          </Button>
        </div>
      </form>
    </div>
  )
}
