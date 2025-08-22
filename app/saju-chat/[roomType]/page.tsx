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
import { getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { trackEvent } from "@/lib/analytics"

export default function SajuChatPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [saju, setSaju] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [defaultProfileLoaded, setDefaultProfileLoaded] = useState(false)
  const [sessionKey, setSessionKey] = useState("")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [currentChatRoom, setCurrentChatRoom] = useState(null)
  const [isLoadingOAuth, setIsLoadingOAuth] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)

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

  useEffect(() => {
    let isMounted = true
    let initTimeout: NodeJS.Timeout

    const initializePage = async () => {
      try {
        initTimeout = setTimeout(() => {
          if (isMounted) {
            console.error("❌ Initialization timeout after 10 seconds")
            setLoading(false)
            toast({
              title: "로딩 시간 초과",
              description: "페이지 로딩이 지연되고 있습니다. 새로고침해주세요.",
              variant: "destructive",
            })
          }
        }, 10000)

        // Wait a bit for auth state to settle if coming from OAuth
        const authReturnAction = localStorage.getItem("auth_return_action")
        if (authReturnAction === "continue_to_chat") {
          console.log("Coming from OAuth, waiting for auth state to settle...")
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }

        const { data } = await supabase.auth.getSession()
        const isAuthenticated = Boolean(data.session?.user)

        console.log("Authentication check:", { isAuthenticated, userId: data.session?.user?.id })

        setIsLoggedIn(isAuthenticated)

        if (isAuthenticated) {
          console.log("User is authenticated:", data.session?.user.id)
          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", data.session.user.id)

          console.log("✅ User is authenticated, loading default saju profile first...")

          try {
            const defaultSessionPromise = getDefaultSajuSession(data.session.user.id)
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("API timeout")), 5000))

            const defaultSession = await Promise.race([defaultSessionPromise, timeoutPromise])

            if (defaultSession && isMounted) {
              console.log("Found default saju session:", defaultSession.id)

              const profilePromise = getSajuProfileBySessionId(defaultSession.id)
              const profileTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Profile API timeout")), 5000),
              )

              const profile = await Promise.race([profilePromise, profileTimeoutPromise])

              if (profile && isMounted) {
                console.log("Successfully loaded default saju profile, using as priority")

                // Create chat saju data structure from profile
                const chatSajuData = {
                  saju: profile.saju,
                  name: profile.name,
                  gender: profile.gender,
                  interpretation: "",
                  returnPath: "/",
                  timeStandard: "KST",
                  birthCityId: null,
                  daeun: profile.saju.daeun,
                  concerns: [],
                  userId: data.session.user.id,
                  authUserId: data.session.user.id,
                  sessionId: profile.id,
                  birthInfo: {
                    solarYear: Number.parseInt(profile.birthYear),
                    solarMonth: Number.parseInt(profile.birthMonth),
                    solarDay: Number.parseInt(profile.birthDay),
                    solarHour: Number.parseInt(profile.birthHour),
                    solarMinute: Number.parseInt(profile.birthMinute),
                    lunarYear: Number.parseInt(profile.lunarYear),
                    lunarMonth: Number.parseInt(profile.lunarMonth),
                    lunarDay: Number.parseInt(profile.lunarDay),
                    timeUnknown: profile.timeUnknown,
                    birthCityId: null,
                    timeStandard: "KST",
                  },
                }

                localStorage.setItem("current_saju", JSON.stringify(chatSajuData))
                localStorage.setItem("saju_session_id", profile.id)

                setSaju(chatSajuData)
                setDefaultProfileLoaded(true)
                const generatedKey = `chat_${chatSajuData.name || "user"}_${roomType}`
                setSessionKey(generatedKey)

                let chatRoom = null
                if (!roomId) {
                  chatRoom = createTemporaryChatRoom({
                    sessionId: profile.id,
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

                clearTimeout(initTimeout)
                setLoading(false)
                return
              }
            } else {
              console.log("No default saju session found for authenticated user")
            }
          } catch (error) {
            console.error("Error loading default saju session:", error)
          }

          console.log("No default profile found, checking localStorage as fallback")
        } else {
          console.log("User is not authenticated")
          localStorage.removeItem("user_authenticated")
          localStorage.removeItem("user_id")
        }

        const savedSaju = localStorage.getItem("current_saju")

        if (!savedSaju) {
          console.log("No saju data found in localStorage")

          // If coming from onboarding, try to get data from tempSajuData
          const tempSajuData = localStorage.getItem("tempSajuData")
          if (tempSajuData && isAuthenticated) {
            console.log("Found tempSajuData, converting to current_saju")
            const tempData = JSON.parse(tempSajuData)

            // Create chat saju data structure
            const chatSajuData = {
              saju: tempData,
              name: tempData.name,
              gender: tempData.gender,
              interpretation: "",
              returnPath: "/",
              timeStandard: tempData.timeStandard,
              birthCityId: tempData.birthCityId,
              daeun: tempData.daeun,
              concerns: tempData.concerns || [],
              userId: data.session.user.id,
              authUserId: data.session.user.id,
              sessionId: localStorage.getItem("saju_session_id"),
              birthInfo: {
                solarYear: tempData.year,
                solarMonth: tempData.month,
                solarDay: tempData.day,
                solarHour: tempData.hour,
                solarMinute: tempData.minute,
                lunarYear: tempData.lunarYear,
                lunarMonth: tempData.lunarMonth,
                lunarDay: tempData.lunarDay,
                timeUnknown: tempData.timeUnknown,
                birthCityId: tempData.birthCityId,
                timeStandard: tempData.timeStandard,
              },
            }

            localStorage.setItem("current_saju", JSON.stringify(chatSajuData))
            localStorage.removeItem("tempSajuData")

            if (isMounted) {
              setSaju(chatSajuData)
              const generatedKey = `chat_${chatSajuData.name || "user"}_${roomType}`
              setSessionKey(generatedKey)

              let chatRoom = null
              if (!roomId) {
                chatRoom = createTemporaryChatRoom({
                  sessionId: chatSajuData.sessionId || `fallback-${Date.now()}`,
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

              clearTimeout(initTimeout)
              setLoading(false)
              return
            }
          }

          if (isMounted) {
            clearTimeout(initTimeout)
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

        // 인증된 사용자인 경우, 현재 사용자의 데이터인지 확인
        if (isAuthenticated && data.session?.user) {
          const currentUserId = data.session.user.id
          const sajuUserId = parsedSaju.userId || parsedSaju.authUserId

          // 사주 데이터가 다른 사용자의 것이라면 삭제하고 홈으로 리다이렉트
          if (sajuUserId && sajuUserId !== currentUserId) {
            console.log("Saju data belongs to different user, clearing and redirecting")
            localStorage.removeItem("current_saju")
            localStorage.removeItem("tempSajuData")
            localStorage.removeItem("saju_session_id")

            if (isMounted) {
              clearTimeout(initTimeout)
              toast({
                title: "사주 정보가 없습니다",
                description: "새로운 사주를 입력해주세요.",
                variant: "destructive",
              })
              router.push("/")
            }
            return
          }

          // 현재 사용자 ID를 사주 데이터에 추가
          if (!sajuUserId) {
            parsedSaju.userId = currentUserId
            parsedSaju.authUserId = currentUserId
            localStorage.setItem("current_saju", JSON.stringify(parsedSaju))
          }
        }

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

          clearTimeout(initTimeout)
          setLoading(false)
        }
      } catch (error) {
        console.error("❌ Error loading saju data:", error)
        if (isMounted) {
          clearTimeout(initTimeout)
          setLoading(false)
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
      if (initTimeout) {
        clearTimeout(initTimeout)
      }
    }
  }, [router, toast, roomType, roomId, supabase])

  useEffect(() => {
    if (saju && !loading) {
      trackEvent("USER_chat_session_start", {
        room_type: roomType,
        is_logged_in: isLoggedIn,
        has_default_profile: defaultProfileLoaded,
        session_id: sessionKey,
      })

      const isFirstChat = !localStorage.getItem("has_completed_first_chat")
      if (isFirstChat) {
        trackEvent("CONVERSION_first_chat_complete", {
          room_type: roomType,
          user_type: isLoggedIn ? "authenticated" : "anonymous",
        })
        localStorage.setItem("has_completed_first_chat", "true")
      }
    }
  }, [saju, loading, roomType, isLoggedIn, defaultProfileLoaded, sessionKey])

  useEffect(() => {
    if (!loading) {
      const isFirstVisit = !localStorage.getItem("user_has_visited")
      const isReturnVisit = localStorage.getItem("user_has_visited") === "true"

      if (isFirstVisit) {
        trackEvent("USER_first_visit", {
          entry_point: "saju_chat",
          room_type: roomType,
        })
        localStorage.setItem("user_has_visited", "true")
      } else if (isReturnVisit) {
        trackEvent("USER_return_visit", {
          entry_point: "saju_chat",
          room_type: roomType,
        })
      }

      trackEvent("USER_session_start", {
        page: "saju_chat",
        room_type: roomType,
        is_logged_in: isLoggedIn,
      })
    }
  }, [loading, roomType, isLoggedIn])

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

  const handleSetCurrentChatRoomId = useCallback((chatRoomId: string) => {
    console.log("[v0] Page: Setting current chat room ID to:", chatRoomId)
    setCurrentChatRoom({ id: chatRoomId, isTemporary: chatRoomId.startsWith("temp-") })
  }, [])

  const handleOAuth = useCallback(
    async (provider: "kakao" | "google") => {
      console.log(`🔐 Starting ${provider} OAuth...`)

      try {
        setIsLoadingOAuth(true)

        // 현재 URL과 세션 정보를 저장
        const currentUrl = window.location.href
        const sessionId = localStorage.getItem("saju_session_id")

        localStorage.setItem("auth_return_url", currentUrl)
        if (sessionId) {
          localStorage.setItem("pending_session_link", sessionId)
        }

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
        setSignupOpen(false) // signup dialog 닫기
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

      trackEvent("auth_attempt", {
        provider: provider,
        context: "chat_signup_dialog",
        user_type: "anonymous",
      })
    },
    [supabase, toast],
  )

  const checkAnonymousSession = useCallback(async () => {
    console.log("Checking anonymous session. isLoggedIn:", isLoggedIn)

    if (isLoggedIn || defaultProfileLoaded) {
      console.log("User is logged in or default profile loaded, skipping anonymous session check")
      localStorage.removeItem("anonymous_session_created")
      return
    }

    if (!loading) {
      const sessionId = localStorage.getItem("saju_session_id")
      const anonymousSessionCreated = localStorage.getItem("anonymous_session_created")
      const authReturnAction = localStorage.getItem("auth_return_action")

      // onboarding에서 바로 온 경우는 signup dialog 표시하지 않음
      if (authReturnAction === "continue_to_chat") {
        console.log("Came from onboarding, not showing signup dialog")
        return
      }

      console.log("Session ID from localStorage:", sessionId)
      console.log("Anonymous session created flag:", anonymousSessionCreated)

      if (sessionId && anonymousSessionCreated === "true") {
        try {
          const { data, error } = await supabase
            .from("saju_sessions")
            .select("auth_user_id, name")
            .eq("id", sessionId)
            .single()

          console.log("Database session check result:", { data, error })

          if (!error && data && data.auth_user_id === null) {
            console.log("Found anonymous saju_session, showing signup dialog after delay")

            const timer = setTimeout(() => {
              setSignupOpen(true)
            }, 2000)

            return () => clearTimeout(timer)
          } else if (!error && data && data.auth_user_id) {
            console.log("Session is already linked to authenticated user:", data.auth_user_id)
            localStorage.removeItem("anonymous_session_created")
          }
        } catch (error) {
          console.error("Error checking saju_session:", error)
        }
      }
    }
  }, [isLoggedIn, loading, defaultProfileLoaded, supabase])

  useEffect(() => {
    checkAnonymousSession()
  }, [isLoggedIn, loading, defaultProfileLoaded, supabase])

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
    <div className="h-[100dvh] w-full relative supports-[height:100dvh]:h-[100dvh] supports-[height:100svh]:h-[100svh] overflow-hidden">
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
        setCurrentChatRoomId={handleSetCurrentChatRoomId}
      />

      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} onSelectProvider={handleOAuth} />
    </div>
  )
}
