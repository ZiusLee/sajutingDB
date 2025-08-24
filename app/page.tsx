"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import LandingPageClient from "@/components/landing-page-client"
import { trackIntegratedEvents, trackUserEvents } from "@/lib/analytics"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [autoShowOnboarding, setAutoShowOnboarding] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    trackIntegratedEvents.pageView("home")
    trackUserEvents.sessionStart()

    const handleUserRedirection = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          // Not authenticated, show landing page
          const isFirstVisit = !localStorage.getItem("user_visited_before")
          if (isFirstVisit) {
            localStorage.setItem("user_visited_before", "true")
            trackUserEvents.firstVisit()
          } else {
            trackUserEvents.returnVisit()
          }

          setShowLanding(true)
          setIsLoading(false)
          return
        }

        console.log("✅ User is authenticated, checking for saju sessions...")

        // Check if user has any saju sessions
        const { data: sessions, error } = await supabase
          .from("saju_sessions")
          .select("id")
          .eq("auth_user_id", session.user.id) // Fixed column name from user_id to auth_user_id
          .limit(1)

        if (error) {
          console.error("Error checking saju sessions:", error)
          setShowLanding(true)
          setIsLoading(false)
          return
        }

        if (sessions && sessions.length > 0) {
          console.log("✅ User has saju sessions, redirecting to saju chat...")
          router.push("/saju-chat/sajuping")
        } else {
          console.log("✅ User has no saju sessions, auto-triggering profile creation...")
          setAutoShowOnboarding(true)
          setShowLanding(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setShowLanding(true)
        setIsLoading(false)
      }
    }

    handleUserRedirection()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (showLanding) {
    return <LandingPageClient autoShowOnboarding={autoShowOnboarding} />
  }

  return null
}
