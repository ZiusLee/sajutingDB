"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState<Error | null>(null)

  try {
    const supabase = createClientComponentClient()

    useEffect(() => {
      const checkAuth = async () => {
        setIsLoading(true)
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          setIsAuthenticated(!!session)
          setUser(session?.user || null)
        } catch (err) {
          console.error("Error checking authentication:", err)
          setIsAuthenticated(false)
          setError(err instanceof Error ? err : new Error("Unknown auth error"))
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setIsAuthenticated(!!session)
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }, [supabase])

    const login = async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          setError(error)
          return { success: false, error: error.message }
        }
        return { success: true, error: null }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error during login")
        setError(error)
        return { success: false, error: error.message }
      }
    }

    const logout = async () => {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          setError(error)
          return { success: false, error: error.message }
        }
        return { success: true, error: null }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error during logout")
        setError(error)
        return { success: false, error: error.message }
      }
    }

    const register = async (email, password) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          setError(error)
          return { success: false, error: error.message }
        }
        return { success: true, error: null }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error during registration")
        setError(error)
        return { success: false, error: error.message }
      }
    }

    const resetPassword = async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })
        if (error) {
          setError(error)
          return { success: false, error: error.message }
        }
        return { success: true, error: null }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error during password reset")
        setError(error)
        return { success: false, error: error.message }
      }
    }

    return { isAuthenticated, isLoading, user, error, login, logout, register, resetPassword }
  } catch (error) {
    console.error("Error in useAuth hook:", error)
    // Return default values to prevent app crashes
    return {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: error instanceof Error ? error : new Error("Unknown auth error"),
      login: async () => ({ success: false, error: "Auth system unavailable" }),
      logout: async () => ({ success: false, error: "Auth system unavailable" }),
      register: async () => ({ success: false, error: "Auth system unavailable" }),
      resetPassword: async () => ({ success: false, error: "Auth system unavailable" }),
    }
  }
}
