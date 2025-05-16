"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase-client"

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
  // Use our singleton Supabase instance
  const supabase = getSupabase()

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
          setUser(userData.user)
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

  // 초기 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      await refreshUser()
    }

    checkAuth()

    // 인증 상태 변경 이벤트 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      if (session?.user) {
        setUser(session.user)
        // 로그인 상태가 변경되었고 사용자가 있는 경우 마이페이지로 리다이렉션
        // 단, 이미 /mypage 경로에 있는 경우는 제외
        if (window.location.pathname !== "/mypage") {
          router.push("/mypage")
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // 클린업 함수
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // 로그아웃 함수
  const logout = async () => {
    setIsLoading(true)
    try {
      console.log("Logging out...")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("로그아웃 오류:", error)
        throw error // 로그아웃 실패 시 오류 발생
      }

      // Clear localStorage
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_email")

      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
