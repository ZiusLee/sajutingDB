"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import SajuChat from "@/components/saju-chat"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { addSajuToUrl, loadSajuFromLocalStorage } from "@/lib/url-utils"
import { createTemporaryChatRoom } from "@/lib/chat-room-service"
import { ChatGuideModal } from "@/components/chat-guide-modal"

export default function SajuChatPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [saju, setSaju] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>("")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [currentChatRoom, setCurrentChatRoom] = useState<any>(null)
  const [showGuideModal, setShowGuideModal] = useState(false)

  // Stabilize roomId and roomType to prevent infinite re-renders
  const roomId = useMemo(() => searchParams.get("roomId"), [searchParams])
  const roomType = useMemo(() => params.roomType as string, [params.roomType])

  // Validate room type
  const validRoomTypes = ["sajuping", "tarot", "general"]

  useEffect(() => {
    if (roomType && !validRoomTypes.includes(roomType)) {
      router.push("/")
      return
    }
  }, [roomType, router])

  useEffect(() => {
    // Store sidebar toggle function globally for site header to access
    if (typeof window !== "undefined") {
      ;(window as any).toggleSajuChatSidebar = () => setSidebarOpen((prev) => !prev)
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).toggleSajuChatSidebar
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      try {
        console.log("🔄 Initializing saju chat page for room:", roomId)

        // 로컬 스토리지에서 사주 데이터 가져오기
        const savedSaju = localStorage.getItem("current_saju")

        if (!savedSaju) {
          if (isMounted) {
            toast({
              title: "사주 정보가 없습니다",
              description: "먼저 사주를 입력해주세요.",
              variant: "destructive",
            })
            router.push("/")
          }
          return
        }

        const parsedSaju = JSON.parse(savedSaju)

        if (isMounted) {
          setSaju(parsedSaju)

          // Generate a unique session key for this chat room
          const generatedKey = `chat_${parsedSaju.name || "user"}_${roomType}`
          setSessionKey(generatedKey)

          // Get sessionId for chat room creation
          let sessionId = parsedSaju.sessionId
          if (!sessionId) {
            const userId = localStorage.getItem("user_id")
            sessionId = userId || `fallback-${Date.now()}`
          }

          // Check if this is a first-time visit to saju-chat
          const hasSeenChatGuide = localStorage.getItem("has_seen_chat_guide")
          const shouldShowGuide = !hasSeenChatGuide && !roomId // Only show for new chats

          // Auto-create temporary chat room if no roomId is provided
          let chatRoom = null
          if (!roomId) {
            console.log("🆕 Creating temporary chat room...")
            chatRoom = createTemporaryChatRoom({
              sessionId,
              title: "새로운 대화",
              roomType: roomType || "sajuping",
              isTemporary: true,
            })

            setCurrentChatRoom(chatRoom)
            console.log("✅ Temporary chat room created:", chatRoom.id)

            // Update URL with the temporary room ID without triggering a page reload
            const newUrl = `/saju-chat/${roomType}?roomId=${chatRoom.id}`
            window.history.replaceState({}, "", newUrl)

            // Show guide modal for new chats
            if (shouldShowGuide) {
              setShowGuideModal(true)
            }
          } else {
            // If roomId exists, we'll handle it in the chat component
            setCurrentChatRoom({ id: roomId, isTemporary: roomId.startsWith("temp-") })
          }

          // 원래 경로 저장 (있는 경우)
          const lastChatData = loadSajuFromLocalStorage("last_chat_saju_data")
          if (lastChatData && lastChatData.returnPath) {
            localStorage.setItem("chat_return_path", lastChatData.returnPath)
          }

          // 마이페이지에서 왔는지 확인 (한 번만 체크하고 플래그 제거)
          const fromMyPage = sessionStorage.getItem("from_mypage")
          if (fromMyPage === "true") {
            console.log("✅ Chat opened from mypage - flag confirmed")
            // 플래그 제거하여 무한 로그 방지
            sessionStorage.removeItem("from_mypage")
          }

          // 로그인 상태 확인
          const userToken = localStorage.getItem("user_token")
          setIsLoggedIn(!!userToken)

          setLoading(false)
          console.log("✅ Page initialization completed")
        }
      } catch (error) {
        console.error("❌ Error loading saju data:", error)
        if (isMounted) {
          toast({
            title: "데이터 로딩 오류",
            description: "사주 데이터를 불러오는 중 오류가 발생했습니다.",
            variant: "destructive",
          })
          router.push("/")
        }
      }
    }

    initializePage()

    return () => {
      isMounted = false
    }
  }, [router, toast, roomType, roomId])

  const handleBack = () => {
    try {
      // 저장된 원래 경로가 있으면 그 경로로 이동
      const savedReturnPath = localStorage.getItem("chat_return_path")

      if (savedReturnPath) {
        // 사주 데이터가 있는지 확인
        if (saju) {
          // URL 유틸리티 함수를 사용하여 사주 데이터를 URL에 추가
          const urlWithSaju = addSajuToUrl(savedReturnPath, saju.saju, saju.name, saju.gender)

          router.push(urlWithSaju)
        } else {
          router.push(savedReturnPath)
        }
      } else if (saju) {
        // 사주 데이터가 있으면 결과 페이지로 이동
        const sajuParam = encodeURIComponent(JSON.stringify(saju.saju))
        const nameParam = saju.name ? `&name=${encodeURIComponent(saju.name)}` : ""
        const genderParam = saju.gender ? `&gender=${encodeURIComponent(saju.gender)}` : ""

        router.push(`/result?saju=${sajuParam}${nameParam}${genderParam}`)
      } else {
        router.push("/chat-list")
      }
    } catch (error) {
      console.error("Error in handleBack:", error)
      router.push("/chat-list")
    }
  }

  const handleChatRoomPersisted = (newChatRoomId: string) => {
    // Update the current chat room when it gets persisted
    setCurrentChatRoom({ id: newChatRoomId, isTemporary: false })

    // Update URL with the persisted room ID
    const newUrl = `/saju-chat/${roomType}?roomId=${newChatRoomId}`
    window.history.replaceState({}, "", newUrl)

    console.log("✅ Chat room persisted and URL updated:", newChatRoomId)
  }

  const handleGuideModalClose = () => {
    setShowGuideModal(false)
    // Mark that user has seen the guide
    localStorage.setItem("has_seen_chat_guide", "true")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!saju) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">사주 정보가 없습니다</h2>
          <p className="text-muted-foreground mb-4">먼저 사주를 입력해주세요.</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            홈으로 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <SajuChat
          saju={saju.saju}
          name={saju.name || "사용자"}
          gender={saju.gender || "남"}
          initialInterpretation={saju.interpretation || ""}
          roomType={roomType}
          onBack={handleBack}
          isLoggedIn={isLoggedIn}
          sessionKey={sessionKey}
          birthInfo={saju.birthInfo}
          concerns={saju.concerns || []}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          currentChatRoomId={currentChatRoom?.id}
          temporaryChatRoom={currentChatRoom?.isTemporary ? currentChatRoom : undefined}
          onChatRoomPersisted={handleChatRoomPersisted}
        />
      </div>

      {/* Chat Guide Modal */}
      <ChatGuideModal isOpen={showGuideModal} onClose={handleGuideModalClose} userName={saju?.name || "사용자"} />
    </>
  )
}
