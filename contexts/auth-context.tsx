"use client"

import { createContext, useContext, useState, useEffect, useRef, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase-client"
import { findAndLinkSessions } from "@/lib/saju-session-service"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Supabase 인스턴스를 ref로 안정화
  const supabaseRef = useRef(getSupabase())
  const supabase = supabaseRef.current

  // 초기화 완료 여부를 추적
  const [isInitialized, setIsInitialized] = useState(false)
  const initRef = useRef(false)

  // 리다이렉션을 한 번만 실행하도록 추적
  const redirectedRef = useRef(false)

  // 사주 세션이 있는지 확인하는 함수
  const checkSajuSession = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("saju_sessions").select("id").eq("auth_user_id", userId).limit(1)

      if (error) {
        console.error("Error checking saju session:", error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error("Error checking saju session:", error)
      return false
    }
  }

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      console.log("Refreshing user data...")
      setIsLoading(true)

      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw sessionError
      }

      if (sessionData?.session) {
        console.log("Session found, getting user data...")
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error("User error:", userError)
          throw userError
        }

        if (userData?.user) {
          console.log("User authenticated:", userData.user.id)

          // 이전 사용자와 동일한지 확인 후에만 업데이트
          setUser((prevUser) => {
            if (prevUser?.id !== userData.user.id) {
              // 새로운 사용자인 경우에만 localStorage 업데이트
              localStorage.setItem("user_authenticated", "true")
              localStorage.setItem("user_id", userData.user.id)
              if (userData.user.user_metadata?.name) {
                localStorage.setItem("user_name", userData.user.user_metadata.name)
              }
              if (userData.user.email) {
                localStorage.setItem("user_email", userData.user.email)
              }
              return userData.user
            }
            return prevUser
          })

          return userData.user
        } else {
          console.log("No user found in session")
          setUser(null)
        }
      } else {
        console.log("No session found")
        setUser(null)
      }
      return null
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // 안전한 리다이렉션 함수
  const safeRedirect = async (userId: string) => {
    if (redirectedRef.current) return

    const currentPath = window.location.pathname

    // 이미 올바른 페이지에 있으면 리다이렉션하지 않음
    if (
      currentPath === "/saju-chat/sajuping" ||
      currentPath.startsWith("/saju-chat") ||
      currentPath === "/result" ||
      currentPath === "/mypage"
    )
      return

    const excludedPaths = ["/saju-chat", "/result", "/chat-list", "/auth", "/mypage"]
    const shouldRedirect = !excludedPaths.some((p) => currentPath.startsWith(p))
    const fromMyPage = sessionStorage.getItem("from_mypage") === "true"

    if (shouldRedirect && !fromMyPage) {
      redirectedRef.current = true
      setTimeout(() => {
        redirectedRef.current = false
      }, 1000) // 1초 후 리다이렉션 가능하도록 리셋

      // 사주 세션이 있는지 확인
      const hasSajuSession = await checkSajuSession(userId)

      if (hasSajuSession) {
        // 사주 세션이 있으면 채팅으로
        console.log("User has saju session, redirecting to chat")

        // 기존 사주 데이터를 로드해서 current_saju에 설정
        try {
          const { data: sajuData, error } = await supabase
            .from("saju_sessions")
            .select("*")
            .eq("auth_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (!error && sajuData) {
            // 사주 데이터를 current_saju 형태로 변환
            const chatSajuData = {
              saju: {
                yearStem: sajuData.year_stem,
                yearBranch: sajuData.year_branch,
                monthStem: sajuData.month_stem,
                monthBranch: sajuData.month_branch,
                dayStem: sajuData.day_stem,
                dayBranch: sajuData.day_branch,
                timeStem: sajuData.time_stem,
                timeBranch: sajuData.time_branch,
              },
              name: sajuData.name,
              gender: sajuData.gender,
              interpretation: "",
              returnPath: "/",
              timeStandard: sajuData.time_standard,
              birthCityId: sajuData.birth_city_id,
              concerns: sajuData.concerns || [],
              sessionId: sajuData.id,
              birthInfo: {
                solarYear: sajuData.solar_year,
                solarMonth: sajuData.solar_month,
                solarDay: sajuData.solar_day,
                solarHour: sajuData.solar_hour,
                solarMinute: sajuData.solar_minute,
                lunarYear: sajuData.lunar_year,
                lunarMonth: sajuData.lunar_month,
                lunarDay: sajuData.lunar_day,
                timeUnknown: sajuData.time_unknown,
                birthCityId: sajuData.birth_city_id,
                timeStandard: sajuData.time_standard,
              },
            }

            localStorage.setItem("current_saju", JSON.stringify(chatSajuData))
            localStorage.setItem("saju_session_id", sajuData.id)
          }
        } catch (error) {
          console.error("Error loading saju data:", error)
        }

        router.push("/saju-chat/sajuping")
      } else {
        // 사주 세션이 없으면 온보딩으로 (홈페이지에서 온보딩 플로우 시작)
        console.log("User has no saju session, redirecting to onboarding")
        router.push("/?showOnboarding=true")
      }
    }
  }

  // 초기 로그인 상태 확인 - 한 번만 실행
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let mounted = true

    const checkAuth = async () => {
      try {
        await refreshUser()
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    checkAuth()

    // 인증 상태 변경 이벤트 리스너 - 한 번만 설정
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        setUser((prevUser) => {
          // 동일한 사용자인 경우 상태 업데이트 방지
          if (prevUser?.id === session.user.id) {
            return prevUser
          }

          // 새로운 사용자인 경우에만 localStorage 업데이트
          localStorage.setItem("user_authenticated", "true")
          localStorage.setItem("user_id", session.user.id)
          if (session.user.user_metadata?.name) {
            localStorage.setItem("user_name", session.user.user_metadata.name)
          }
          if (session.user.email) {
            localStorage.setItem("user_email", session.user.email)
          }

          // 로그인 성공 시 세션 연결 시도 (비동기로 처리)
          setTimeout(async () => {
            try {
              const { success, linkedCount } = await findAndLinkSessions()
              if (success && linkedCount > 0) {
                console.log(`Successfully linked ${linkedCount} sessions to user`)
              }
            } catch (error) {
              console.error("Error linking sessions:", error)
            }
            // 세션 연결 시도 후 리다이렉션 (사주 세션 확인 후 적절한 페이지로)
            await safeRedirect(session.user.id)
          }, 100)

          return session.user
        })
      } else {
        setUser((prevUser) => {
          if (prevUser === null) return prevUser // 이미 null인 경우 업데이트 방지

          // 로그아웃 시에만 localStorage 클리어
          localStorage.removeItem("user_authenticated")
          localStorage.removeItem("user_id")
          localStorage.removeItem("user_name")
          localStorage.removeItem("user_email")

          return null
        })
      }

      setIsLoading(false)
    })

    // 클린업 함수
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // 빈 의존성 배열로 변경

  // 로그아웃 함수
  const logout = async () => {
    if (isLoading) return // 이미 로딩 중이면 중복 실행 방지

    setIsLoading(true)
    try {
      console.log("Logging out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("로그아웃 오류:", error)
        throw error
      }

      // Clear localStorage
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_email")
      localStorage.removeItem("current_saju")
      localStorage.removeItem("saju_session_id")

      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Context 값을 메모화하여 불필요한 re-render 방지
  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      logout,
      refreshUser,
    }),
    [user, isLoading],
  ) // logout과 refreshUser는 함수이므로 의존성에서 제외

  // 초기화가 완료될 때까지 로딩 상태 유지
  if (!isInitialized) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: true,
          logout,
          refreshUser,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
