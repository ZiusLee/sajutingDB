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
import { getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { calculateElementsFromSaju } from "@/lib/element-utils"

export default function SajuChatPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [saju, setSaju] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionKey, setSessionKey] = useState("")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [currentChatRoom, setCurrentChatRoom] = useState(null)
  const [isLoadingOAuth, setIsLoadingOAuth] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [forceSignupOpen, setForceSignupOpen] = useState(false)

  const supabase = getSupabase()

  const roomId = useMemo(() => searchParams.get("roomId"), [searchParams])
  const roomType = useMemo(() => params.roomType as string, [params.roomType])

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
    if (typeof window !== "undefined") {
      ;(window as any).toggleSajuChatSidebar = handleSidebarToggle
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).toggleSajuChatSidebar
      }
    }
  }, [handleSidebarToggle])

  // 대표 사주 데이터를 가져오는 함수 (AuthContext와 동일한 로직)
  const getDefaultSajuData = async (userId: string) => {
    try {
      // 먼저 is_default가 true인 세션 찾기
      const { data: defaultSession, error: defaultError } = await supabase
        .from("saju_sessions")
        .select("id")
        .eq("auth_user_id", userId)
        .eq("is_default", true)
        .single()

      let sessionId = null

      if (!defaultError && defaultSession) {
        sessionId = defaultSession.id
        console.log("Found default session:", sessionId)
      } else {
        // 대표 사주가 없으면 가장 최근 세션을 대표로 설정
        const { data: recentSession, error: recentError } = await supabase
          .from("saju_sessions")
          .select("id")
          .eq("auth_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (!recentError && recentSession) {
          sessionId = recentSession.id
          console.log("Using most recent session as default:", sessionId)

          // 대표 사주로 설정
          await supabase
            .from("saju_sessions")
            .update({ is_default: true })
            .eq("id", sessionId)
            .eq("auth_user_id", userId)

          console.log("Set session as default:", sessionId)
        }
      }

      if (sessionId) {
        // getSajuProfileBySessionId를 사용해서 완전한 프로필 데이터 가져오기
        const profile = await getSajuProfileBySessionId(sessionId)

        if (profile) {
          console.log("Loaded default saju profile:", profile)

          // 오행 데이터 확인 및 계산
          let elementsData = profile.saju.elements
          if (!elementsData) {
            console.log("오행 데이터가 없어서 계산 중...")
            elementsData = calculateElementsFromSaju(
              profile.saju.yearStem,
              profile.saju.yearBranch,
              profile.saju.monthStem,
              profile.saju.monthBranch,
              profile.saju.dayStem,
              profile.saju.dayBranch,
              profile.saju.hourStem,
              profile.saju.hourBranch,
            )

            // 계산된 오행 데이터를 DB에 저장
            const { data: currentSaju } = await supabase
              .from("saju_sessions")
              .select("saju")
              .eq("id", sessionId)
              .single()

            if (currentSaju) {
              const updatedSaju = { ...currentSaju.saju, elements: elementsData }
              await supabase.from("saju_sessions").update({ saju: updatedSaju }).eq("id", sessionId)

              console.log("오행 데이터 계산 및 저장 완료:", elementsData)
            }
          }

          // mypage에서 사용하는 것과 동일한 형태로 변환
          const chatSajuData = {
            sessionId: profile.id,
            saju: {
              ...profile.saju,
              elements: elementsData || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
              dayMaster: profile.saju.dayStem,
              dayMasterHanja: profile.saju.dayStemHanja || "",
            },
            name: profile.name,
            gender: profile.gender,
            year: profile.birthYear,
            month: profile.birthMonth,
            day: profile.birthDay,
            hour: profile.birthHour,
            minute: profile.birthMinute,
            lunarYear: profile.lunarYear || profile.birthYear,
            lunarMonth: profile.lunarMonth || profile.birthMonth,
            lunarDay: profile.lunarDay || profile.birthDay,
            timeUnknown: profile.timeUnknown,
            interpretation: "",
            birthInfo: {
              solarYear: Number.parseInt(profile.birthYear),
              solarMonth: Number.parseInt(profile.birthMonth),
              solarDay: Number.parseInt(profile.birthDay),
              solarHour: Number.parseInt(profile.birthHour) || 0,
              solarMinute: Number.parseInt(profile.birthMinute) || 0,
              lunarYear: Number.parseInt(profile.lunarYear || profile.birthYear),
              lunarMonth: Number.parseInt(profile.lunarMonth || profile.birthMonth),
              lunarDay: Number.parseInt(profile.lunarDay || profile.birthDay),
              timeUnknown: profile.timeUnknown,
            },
          }

          console.log("SajuChat 페이지에서 생성한 기본 사주 데이터:", chatSajuData)
          return chatSajuData
        }
      }

      return null
    } catch (error) {
      console.error("Error getting default saju data:", error)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const isAuthenticated = Boolean(data.session?.user)

        console.log("Authentication check:", { isAuthenticated, userId: data.session?.user?.id })

        setIsLoggedIn(isAuthenticated)

        if (isAuthenticated) {
          console.log("User is authenticated:", data.session?.user.id)
          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", data.session.user.id)
        } else {
          console.log("User is not authenticated")
          localStorage.removeItem("user_authenticated")
          localStorage.removeItem("user_id")
        }

        // 먼저 localStorage에서 사주 데이터 확인
        let savedSaju = localStorage.getItem("current_saju")

        // 로그인된 사용자이고 localStorage에 사주 데이터가 없으면 대표 사주 데이터 로드
        if (!savedSaju && isAuthenticated && data.session?.user) {
          console.log("No saju in localStorage, loading default saju data...")

          const defaultSajuData = await getDefaultSajuData(data.session.user.id)

          if (defaultSajuData) {
            localStorage.setItem("current_saju", JSON.stringify(defaultSajuData))
            localStorage.setItem("saju_session_id", defaultSajuData.sessionId)
            savedSaju = JSON.stringify(defaultSajuData)
            console.log("Loaded and saved default saju data:", defaultSajuData)
          }
        }

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
        console.log("Using saju data:", parsedSaju)

        if (isMounted) {
          setSaju(parsedSaju)

          const generatedKey = `chat_${parsedSaju.name || "user"}_${roomType}`
          setSessionKey(generatedKey)

          let sessionId = parsedSaju.sessionId
          if (!sessionId) {
            const sajuSessionId = localStorage.getItem("saju_session_id")
            sessionId = sajuSessionId || `fallback-${Date.now()}`
          }

          let chatRoom = null
          if (!roomId) {
            chatRoom = createTemporaryChatRoom({
              sessionId,
              title: "새로운 대화",
              roomType: roomType || "sajuping",
              isTemporary: true,
            })

            setCurrentChatRoom(chatRoom)

            const newUrl = `/saju-chat/${roomType}?roomId=${chatRoom.id}`
            window.history.replaceState({}, "", newUrl)
          } else {
            setCurrentChatRoom({ id: roomId, isTemporary: roomId.startsWith("temp-") })
          }

          const lastChatData = loadSajuFromLocalStorage("last_chat_saju_data")
          if (lastChatData && lastChatData.returnPath) {
            localStorage.setItem("chat_return_path", lastChatData.returnPath)
          }

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
  }, [router, toast, roomType, roomId, supabase])

  useEffect(() => {
    const checkAnonymousSession = async () => {
      console.log("Checking anonymous session. isLoggedIn:", isLoggedIn)

      if (!isLoggedIn && !loading) {
        const sessionId = localStorage.getItem("saju_session_id")
        console.log("Session ID from localStorage:", sessionId)

        if (sessionId) {
          try {
            const { data, error } = await supabase
              .from("saju_sessions")
              .select("auth_user_id")
              .eq("id", sessionId)
              .single()

            console.log("Database session check result:", { data, error })

            if (!error && data && data.auth_user_id === null) {
              console.log("Found anonymous saju_session, showing signup dialog")

              const timer = setTimeout(() => {
                setSignupOpen(true)
                setForceSignupOpen(true) // 강제로 열린 상태로 설정
              }, 4000)

              return () => clearTimeout(timer)
            } else if (!error && data && data.auth_user_id) {
              console.log("Session is already linked to authenticated user:", data.auth_user_id)
            }
          } catch (error) {
            console.error("Error checking saju_session:", error)
          }
        }
      } else if (isLoggedIn) {
        console.log("User is logged in, skipping anonymous session check")
      }
    }

    checkAnonymousSession()
  }, [isLoggedIn, loading, supabase])

  const handleBack = useCallback(() => {
    try {
      const savedReturnPath = localStorage.getItem("chat_return_path")

      if (savedReturnPath) {
        if (saju) {
          const urlWithSaju = addSajuToUrl(savedReturnPath, saju.saju, saju.name, saju.gender)
          router.push(urlWithSaju)
        } else {
          router.push(savedReturnPath)
        }
      } else if (saju) {
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
      setCurrentChatRoom((prev: any) => ({ ...prev, id: newChatRoomId, isTemporary: false }))

      const newUrl = `/saju-chat/${roomType}?roomId=${newChatRoomId}`
      if (window.history.replaceState) {
        window.history.replaceState(null, "", newUrl)
      }
    },
    [roomType],
  )

  const handleOAuth = useCallback(
    async (provider: "kakao" | "google") => {
      console.log(`🔐 Starting ${provider} OAuth...`)

      try {
        setIsLoadingOAuth(true)

        const currentUrl = window.location.href
        localStorage.setItem("auth_return_url", currentUrl)

        const redirectTo = `${window.location.origin}/auth/callback`
        console.log("Redirect URL:", redirectTo)

        const options: any = {
          redirectTo,
        }

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
      } catch (e) {
        console.error(`❌ ${provider} OAuth start error:`, e)
        toast({
          title: "로그인 실패",
          description: `${provider === "kakao" ? "카카오" : "구글"} 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.`,
          variant: "destructive",
        })
      } finally {
        setIsLoadingOAuth(false)
      }
    },
    [supabase, toast],
  )

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

      <SignupDialog
        open={signupOpen}
        onOpenChange={(open) => {
          if (!forceSignupOpen) {
            setSignupOpen(open)
          }
          // forceSignupOpen이 true면 닫을 수 없음
        }}
        onSelectProvider={handleOAuth}
        forceOpen={forceSignupOpen}
      />
    </div>
  )
}
