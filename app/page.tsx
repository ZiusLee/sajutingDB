"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import LandingPageClient from "@/components/landing-page-client"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleUserRedirection = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          // Not authenticated, show landing page
          setShowLanding(true)
          setIsLoading(false)
          return
        }

        console.log("✅ User is authenticated, redirecting to saju chat...")
        router.push("/saju-chat/sajuping")
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
    return <LandingPageClient />
  }

  return null
}
