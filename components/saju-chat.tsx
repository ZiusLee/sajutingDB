"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, RotateCcw, Settings, Plus } from "lucide-react"
import { useChat } from "ai/react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MessageFeedbackButtons } from "./message-feedback-buttons"
import { AuthDebugPanel } from "./auth-debug-panel"

interface SajuChatProps {
  compressedSaju: any
  roomType: string
  initialMessages?: any[]
  compatibilityData?: any
  chatRoomId?: string
}

export function SajuChat({
  compressedSaju,
  roomType,
  initialMessages = [],
  compatibilityData,
  chatRoomId,
}: SajuChatProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, reload, setMessages } = useChat({
    api: "/api/saju-chat",
    initialMessages,
    body: {
      compressedSaju,
      name: compressedSaju?.name || "사용자",
      gender: compressedSaju?.gender || "unknown",
      roomType,
      userId: user?.id,
      compatibilityData,
      chatRoomId,
    },
    onError: (error) => {
      console.error("Chat error:", error)
      toast.error("메시지 전송 중 오류가 발생했습니다.")
    },
  })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleContinueGeneration = async () => {
    if (isLoading) return

    try {
      const response = await fetch("/api/saju-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          compressedSaju,
          name: compressedSaju?.name || "사용자",
          gender: compressedSaju?.gender || "unknown",
          roomType,
          userId: user?.id,
          compatibilityData,
          continueFromMessage: true,
          chatRoomId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to continue generation")
      }

      const reader = response.body?.getReader()
      if (!reader) return

      let accumulatedContent = ""
      const lastMessage = messages[messages.length - 1]

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2))
              if (typeof content === "string") {
                accumulatedContent += content

                // 실시간으로 메시지 업데이트
                setMessages((prev) => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: lastMessage.content + accumulatedContent,
                    }
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // JSON 파싱 오류 무시
            }
          }
        }
      }
    } catch (error) {
      console.error("Continue generation error:", error)
      toast.error("계속 생성 중 오류가 발생했습니다.")
    }
  }

  const getRoomTypeTitle = () => {
    switch (roomType) {
      case "sajuping":
        return "사주핑 상담"
      case "compatibility":
        return "궁합 분석"
      case "daeun":
        return "대운 분석"
      case "daily":
        return "오늘의 운세"
      case "tarot":
        return "타로 상담"
      default:
        return "AI 상담"
    }
  }

  const getRoomTypeIcon = () => {
    switch (roomType) {
      case "sajuping":
        return "🔮"
      case "compatibility":
        return "💕"
      case "daeun":
        return "📈"
      case "daily":
        return "🌅"
      case "tarot":
        return "🃏"
      default:
        return "💬"
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">로그인이 필요한 서비스입니다.</p>
          <Button onClick={() => router.push("/login")}>로그인하기</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRoomTypeIcon()}</span>
            <h2 className="text-lg font-semibold">{getRoomTypeTitle()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDebugPanel(!showDebugPanel)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => reload()} disabled={isLoading}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/sajuping_character.png" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-blue-500 text-white ml-auto" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.role === "assistant" && (
                    <div className="mt-2 flex gap-1">
                      <MessageFeedbackButtons
                        messageId={`${index}`}
                        messageContent={message.content}
                        onFeedback={(feedback) => {
                          console.log("Feedback:", feedback)
                        }}
                      />
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{compressedSaju?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/images/sajuping_character.png" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
              <Button type="button" variant="outline" onClick={handleContinueGeneration} disabled={isLoading}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </Card>

      {showDebugPanel && <AuthDebugPanel />}
    </div>
  )
}
