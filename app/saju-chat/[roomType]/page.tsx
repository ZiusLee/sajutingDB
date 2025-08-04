"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import SajuChat from "@/components/saju-chat"
import { getSajuSession } from "@/lib/saju-session-service"
import { getChatRoom } from "@/lib/chat-room-service"
import type { BirthInfo } from "@/types/birth-date"

function SajuChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  const [sajuData, setSajuData] = useState<any>(null)
  const [chatRoom, setChatRoom] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const roomType = "sajuping" // Or get from path params if dynamic

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Get Saju Session
        const sessionKey = localStorage.getItem("saju_session_key")
        if (!sessionKey) {
          throw new Error("사주 세션 정보를 찾을 수 없습니다. 다시 시작해주세요.")
        }

        const session = await getSajuSession(sessionKey)
        if (!session) {
          throw new Error("사주 세션이 만료되었거나 유효하지 않습니다.")
        }
        setSajuData(session)

        // 2. Get or Create Chat Room
        const roomId = searchParams.get("roomId")
        let currentChatRoom

        if (roomId) {
          currentChatRoom = await getChatRoom(roomId)
          if (!currentChatRoom) {
            throw new Error("채팅방을 찾을 수 없습니다.")
          }
        } else {
          // Create a temporary chat room object for the first message
          currentChatRoom = {
            id: `temp-${Date.now()}`,
            isTemporary: true,
            saju_session_key: sessionKey,
            room_type: roomType,
            user_id: user?.id || null,
            session_id: session.sessionId,
          }
        }
        setChatRoom(currentChatRoom)
      } catch (err: any) {
        console.error("Chat initialization error:", err)
        setError(err.message || "채팅을 시작하는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      initialize()
    }
  }, [searchParams, authLoading, user])

  const handleBack = () => {
    router.push("/")
  }

  const handleChatRoomPersisted = (newChatRoomId: string) => {
    // Update the local state to reflect the persisted chat room
    setChatRoom((prev: any) => ({ ...prev, id: newChatRoomId, isTemporary: false }))
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          채팅을 준비하는 중...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4 text-center">
        <div>
          <h2 className="text-xl font-semibold text-destructive">오류 발생</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!sajuData) {
    return null // Or a more specific loading/error state
  }

  return (
    <SajuChat
      saju={sajuData.saju}
      name={sajuData.name}
      gender={sajuData.gender}
      initialInterpretation={sajuData.initialInterpretation}
      roomType={roomType}
      onBack={handleBack}
      isLoggedIn={!!user}
      sessionKey={sajuData.sessionKey}
      birthInfo={sajuData.birthInfo as BirthInfo}
      concerns={sajuData.concerns}
      currentChatRoomId={chatRoom?.id}
      temporaryChatRoom={chatRoom?.isTemporary ? chatRoom : null}
      onChatRoomPersisted={handleChatRoomPersisted}
    />
  )
}

export default function SajuChatPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            페이지를 불러오는 중...
          </div>
        </div>
      }
    >
      <SajuChatPage />
    </Suspense>
  )
}
