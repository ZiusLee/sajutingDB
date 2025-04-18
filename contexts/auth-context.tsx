"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // 초기 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 세션 확인
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("세션 확인 오류:", sessionError)
          throw sessionError // 세션 확인 실패 시 오류 발생
        }

        if (session) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) {
            console.error("사용자 정보 가져오기 오류:", userError)
            throw userError // 사용자 정보 가져오기 실패 시 오류 발생
          }
          setUser(user)
        }
      } catch (error) {
        console.error("인증 확인 오류:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변경 이벤트 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // 클린업 함수
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, router])

  // 로그아웃 함수
  const logout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("로그아웃 오류:", error)
        throw error // 로그아웃 실패 시 오류 발생
      }
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
