"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import SajuChat from "@/components/saju-chat"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { addSajuToUrl, loadSajuFromLocalStorage } from "@/lib/url-utils"
import { createTemporaryChatRoom } from "@/lib/chat-room-service"
import { SignupDialog } from "@/components/signup-dialog"
import { getSupabase } from "@/lib/supabase-client"
import { syncLocalStorageToDatabase } from "@/lib/data-sync"
import { updateAuthUserId } from "@/lib/db-service"

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
  const [isLoading, setIsLoading] = useState(false)

  const [signupOpen, setSignupOpen] = useState(false)
  const supabase = getSupabase()

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

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    // Store sidebar toggle function globally for site header to access
    if (typeof window !== "undefined") {
      ;(window as any).toggleSajuChatSidebar = handleSidebarToggle
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).toggleSajuChatSidebar
      }
    }
  }, [handleSidebarToggle])

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      try {
        // 로그인 여부 확인 (localStorage flag 우선, 없으면 Supabase 세션)
        const authed = localStorage.getItem("user_authenticated") === "true"
        if (authed) {
          setIsLoggedIn(true)
        } else {
          const { data } = await supabase.auth.getSession()
          setIsLoggedIn(Boolean(data.session?.user))
          if (data.session?.user) {
            localStorage.setItem("user_authenticated", "true")
            localStorage.setItem("user_id", data.session.user.id)
          }
        }

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
            const sajuSessionId = localStorage.getItem("saju_session_id")
            sessionId = sajuSessionId || `fallback-${Date.now()}`
          }

          // Auto-create temporary chat room if no roomId is provided
          let chatRoom = null
          if (!roomId) {
            chatRoom = createTemporaryChatRoom({
              sessionId,
              title: "새로운 대화",
              roomType: roomType || "sajuping",
              isTemporary: true,
            })

            setCurrentChatRoom(chatRoom)

            // Update URL with the temporary room ID without triggering a page reload
            const newUrl = `/saju-chat/${roomType}?roomId=${chatRoom.id}`
            window.history.replaceState({}, "", newUrl)
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
            sessionStorage.removeItem("from_mypage")
          }

          setLoading(false)
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
  }, [router, toast, roomType, roomId, supabase.auth])


  // Open signup dialog automatically if user has tempSajuData (from onboarding)
  useEffect(() => {
    if (!isLoggedIn) {
      const tempSajuData = localStorage.getItem("tempSajuData")
      
      if (tempSajuData) {
        console.log("Found tempSajuData from onboarding, showing signup dialog")
        
        // Add a small delay for better UX
        const timer = setTimeout(() => {
          setSignupOpen(true)
        }, 1500) // 1.5 second delay
        
        return () => clearTimeout(timer)
      }
    }
  }, [isLoggedIn])

  const handleBack = useCallback(() => {
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
  }, [router, saju])

  const handleChatRoomPersisted = useCallback(
    (newChatRoomId: string) => {
      // Update the current chat room when it gets persisted
      setCurrentChatRoom((prev: any) => ({ ...prev, id: newChatRoomId, isTemporary: false }))

      // Update URL with the persisted room ID without triggering re-render
      const newUrl = `/saju-chat/${roomType}?roomId=${newChatRoomId}`
      if (window.history.replaceState) {
        window.history.replaceState(null, "", newUrl)
      }
    },
    [roomType],
  )

  // OAuth handler - simplified and unified
  const handleOAuth = async (provider: "kakao" | "google") => {
    console.log(`🔐 Starting ${provider} OAuth...`)

    try {
      setIsLoading(true)

      // Store current location for redirect back
      const currentUrl = window.location.href
      localStorage.setItem("auth_return_url", currentUrl)

      const redirectTo = `${window.location.origin}/auth/callback`
      console.log("Redirect URL:", redirectTo)

      const options: any = {
        redirectTo,
      }

      // Provider-specific options
      if (provider === "google") {
        options.queryParams = {
          access_type: "offline",
          prompt: "consent",
        }
        options.scopes = "openid email profile"
      }

      console.log(`OAuth options for ${provider}:`, options)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      })

      if (error) {
        console.error(`❌ ${provider} OAuth error:`, error)
        toast({
          title: "로그인 오류",
          description: `${provider === "kakao" ? "카카오" : "구글"} 로그인 중 오류가 발생했습니다: ${error.message}`,
          variant: "destructive",
        })
        throw error
      }

      console.log(`✅ ${provider} OAuth initiated successfully`)
      // OAuth redirect will happen automatically
    } catch (e) {
      console.error(`❌ ${provider} OAuth start error:`, e)
      toast({
        title: "로그인 실패",
        description: `${provider === "kakao" ? "카카오" : "구글"} 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
    <div className="container mx-auto px-4 py-6 relative">
      {/* Chat */}
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
        onSidebarToggle={handleSidebarToggle}
        currentChatRoomId={currentChatRoom?.id}
        temporaryChatRoom={currentChatRoom?.isTemporary ? currentChatRoom : undefined}
        onChatRoomPersisted={handleChatRoomPersisted}
      />

      {/* Unified Signup Dialog with Terms */}
      <SignupDialog
        open={signupOpen}
        onOpenChange={setSignupOpen}
        onSelectProvider={handleOAuth}
        isOverLimit={false}
        currentCount={0}
        maxCount={0}
      />
    </div>
  )
}
