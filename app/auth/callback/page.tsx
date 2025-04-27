"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const router = useRouter()
  // Use our singleton Supabase instance
  const supabase = getSupabase()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get("code")

      if (code) {
        try {
          console.log("Exchanging code for session...")
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Error exchanging code for session:", error)
            router.push("/login?error=callback_error")
            return
          }

          console.log("Session exchange successful, getting user data...")
          // Get user data after successful login
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (user) {
            console.log("User authenticated:", user.id)
            // Store user info in localStorage if needed
            localStorage.setItem("user_authenticated", "true")
            localStorage.setItem("user_id", user.id)

            // If user has user_metadata with name, store it
            if (user.user_metadata?.name) {
              localStorage.setItem("user_name", user.user_metadata.name)
            } else if (user.email) {
              localStorage.setItem("user_name", user.email.split("@")[0])
            }

            // Link user data if needed
            await linkUserDataIfNeeded(user.id)

            // Redirect to home page or dashboard
            router.push("/")
          } else {
            console.error("No user found after authentication")
            router.push("/login?error=no_user")
          }
        } catch (error) {
          console.error("Error exchanging code for session:", error)
          router.push("/login?error=callback_error")
        }
      } else {
        console.error("No code found in URL")
        router.push("/login?error=no_code")
      }
    }

    // Helper function to link user data if needed
    const linkUserDataIfNeeded = async (authUserId: string) => {
      try {
        // Check if the user already has linked data
        const { data: existingUser, error: userError } = await supabase
          .from("saju_sessions")
          .select("id")
          .eq("auth_user_id", authUserId)
          .single()

        if (userError && userError.code !== "PGRST116") {
          console.error("Error checking for existing user:", userError)
          return
        }

        // If user already has linked data, no need to proceed
        if (existingUser) {
          console.log("User already has linked data:", existingUser.id)
          return
        }

        // Check if there's a user ID in localStorage that needs to be linked
        const localUserId = localStorage.getItem("user_id")
        if (localUserId && localUserId !== authUserId) {
          console.log(`Linking local user ID ${localUserId} to auth user ID ${authUserId}`)

          // Update the auth_user_id for the session
          const { error } = await supabase
            .from("saju_sessions")
            .update({ auth_user_id: authUserId })
            .eq("id", localUserId)

          if (error) {
            console.error("Error linking user data:", error)
          } else {
            console.log("Successfully linked user data")
          }
        }
      } catch (error) {
        console.error("Error in linkUserDataIfNeeded:", error)
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">로그인 처리 중...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
