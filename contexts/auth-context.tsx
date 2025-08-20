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
  const safeRedirect = (path: string) => {
    if (redirectedRef.current) return

    const currentPath = window.location.pathname
    if (currentPath === path) return

    const excludedPaths = ["/mypage", "/saju-chat", "/result", "/chat-list"]
    const shouldRedirect = !excludedPaths.some((p) => currentPath.startsWith(p))
    const fromMyPage = sessionStorage.getItem("from_mypage") === "true"

    if (shouldRedirect && !fromMyPage) {
      redirectedRef.current = true
      setTimeout(() => {
        redirectedRef.current = false
      }, 1000) // 1초 후 리다이렉션 가능하도록 리셋

      router.push(path)
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
              let linkedAnySession = false

              // pending session이 있는지 확인 (온보딩 완료 또는 일반 플로우)
              const pendingSessionId = localStorage.getItem("pending_session_link")
              if (pendingSessionId) {
                console.log(`Linking pending session ${pendingSessionId} to user ${session.user.id}`)

                const { error } = await supabase
                  .from("saju_sessions")
                  .update({
                    auth_user_id: session.user.id,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", pendingSessionId)

                if (error) {
                  console.error("Error linking pending session:", error)
                } else {
                  console.log(`Successfully linked pending session ${pendingSessionId}`)
                  linkedAnySession = true
                  localStorage.removeItem("pending_session_link")
                  localStorage.removeItem("anonymous_session_created")
                  localStorage.removeItem("auth_return_action")
                }
              }

              if (!linkedAnySession) {
                // 기존 사용자가 이미 연결된 세션이 있는지 확인
                const { data: existingSessions } = await supabase
                  .from("saju_sessions")
                  .select("id")
                  .eq("auth_user_id", session.user.id)
                  .limit(1)

                if (!existingSessions || existingSessions.length === 0) {
                  // 기존 연결된 세션이 없는 경우에만 세션 찾기 시도
                  console.log("No existing sessions found, attempting to find and link sessions")
                  const { success, linkedCount } = await findAndLinkSessions()
                  if (success && linkedCount > 0) {
                    console.log(`Successfully linked ${linkedCount} sessions to user`)
                    linkedAnySession = true
                  }
                } else {
                  console.log("User already has existing sessions")
                  linkedAnySession = true
                }
              }

              // 세션 연결 후 원래 URL로 리다이렉션
              const returnUrl = localStorage.getItem("auth_return_url")
              if (returnUrl && returnUrl !== window.location.href) {
                localStorage.removeItem("auth_return_url")
                window.location.href = returnUrl
              }
            } catch (error) {
              console.error("Error linking sessions:", error)
            }
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
          localStorage.removeItem("pending_session_link")
          localStorage.removeItem("anonymous_session_created")

          // Clear saju-related data
          localStorage.removeItem("current_saju")
          localStorage.removeItem("tempSajuData")
          localStorage.removeItem("saju_session_id")
          localStorage.removeItem("last_chat_saju_data")
          localStorage.removeItem("chat_return_path")
          localStorage.removeItem("saved_partners")
          localStorage.removeItem("saju_profiles")

          // Clear any user-specific profile data
          const keys = Object.keys(localStorage)
          keys.forEach((key) => {
            if (key.startsWith("user_profiles_")) {
              localStorage.removeItem(key)
            }
          })

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

      // Clear all user-related localStorage data including saju data
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_email")

      // Clear saju-related data
      localStorage.removeItem("current_saju")
      localStorage.removeItem("tempSajuData")
      localStorage.removeItem("saju_session_id")
      localStorage.removeItem("last_chat_saju_data")
      localStorage.removeItem("chat_return_path")
      localStorage.removeItem("saved_partners")
      localStorage.removeItem("saju_profiles")

      // Clear any user-specific profile data
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("user_profiles_")) {
          localStorage.removeItem(key)
        }
      })

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
