"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()

    // 현재 세션 확인
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("세션 확인 오류:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
