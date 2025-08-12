"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import LandingPageClient from "@/components/landing-page-client"
import { getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { calculateSaju } from "@/lib/saju"
import { toast } from "sonner"

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

        console.log("✅ User is authenticated, redirecting to appropriate chat room...")

        // User is authenticated, redirect to appropriate chat room
        const userId = session.user.id

        try {
          // Get all sessions for this user
          const { data: sessions } = await supabase
            .from("saju_sessions")
            .select("id")
            .eq("auth_user_id", userId)
            .order("created_at", { ascending: true }) // Get oldest first

          if (!sessions || sessions.length === 0) {
            // No saju sessions found, redirect to onboarding
            console.log("No saju sessions found, redirecting to onboarding")
            router.push("/?onboarding=true")
            return
          }

          // Check if first session has only one message (incomplete first chat)
          const firstSessionId = sessions[0].id
          const { data: chatRooms } = await supabase
            .from("chat_rooms")
            .select("id")
            .eq("session_id", firstSessionId)
            .order("created_at", { ascending: true })
            .limit(1)

          if (chatRooms && chatRooms.length > 0) {
            const firstChatRoomId = chatRooms[0].id

            // Check message count in first chat room
            const { data: messages, count } = await supabase
              .from("messages")
              .select("*", { count: "exact" })
              .eq("chat_room_id", firstChatRoomId)

            console.log(`First chat room has ${count} messages`)

            // If first chat room has only 1 message (user message without AI response)
            // or is empty, redirect there to continue the conversation
            if (count === 1 || count === 0) {
              console.log("First chat room is incomplete, redirecting there")
              const profileToUse = await getSajuProfileBySessionId(firstSessionId)
              if (profileToUse) {
                await prepareSajuDataForChat(profileToUse)
                router.push(`/saju-chat/sajuping?roomId=${firstChatRoomId}`)
                return
              }
            }
          }

          // Default behavior: get default session or first session
          const defaultSession = await getDefaultSajuSession(userId)
          let profileToUse = null

          if (defaultSession) {
            profileToUse = await getSajuProfileBySessionId(defaultSession.id)
          } else {
            profileToUse = await getSajuProfileBySessionId(sessions[0].id)
          }

          if (profileToUse) {
            // Prepare saju data for chat
            await prepareSajuDataForChat(profileToUse)
            router.push("/saju-chat/sajuping")
          } else {
            // Fallback to onboarding
            console.log("Could not get profile data, redirecting to onboarding")
            router.push("/?onboarding=true")
          }
        } catch (error) {
          console.error("Error getting saju sessions:", error)
          // Fallback to landing page
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

  const prepareSajuDataForChat = async (profile: any) => {
    try {
      // Get complete session data
      const { data: sessionData, error: sessionError } = await supabase
        .from("saju_sessions")
        .select("id, name, gender, saju, daeun")
        .eq("id", profile.id)
        .single()

      if (sessionError) throw new Error("사주 데이터를 가져오는데 실패했습니다.")

      let dbSaju = (sessionData?.saju as any) || {}
      const dbDaeun = sessionData?.daeun

      // Check if saju data is incomplete and recalculate if needed
      const isSajuIncomplete =
        !dbSaju ||
        !dbSaju.yearStem ||
        !dbSaju.yearBranch ||
        !dbSaju.monthStem ||
        !dbSaju.monthBranch ||
        !dbSaju.dayStem ||
        !dbSaju.dayBranch ||
        !dbSaju.hourStem ||
        !dbSaju.hourBranch ||
        !dbSaju.elements

      if (isSajuIncomplete) {
        console.log("사주 데이터가 불완전하여 재계산 중...")

        const recalculatedSaju = calculateSaju(
          Number.parseInt(profile.lunarYear || profile.birthYear),
          Number.parseInt(profile.lunarMonth || profile.birthMonth),
          Number.parseInt(profile.lunarDay || profile.birthDay),
          profile.timeUnknown ? 12 : Number.parseInt(profile.birthHour),
          profile.timeUnknown ? 0 : Number.parseInt(profile.birthMinute),
          Number.parseInt(profile.birthYear),
          Number.parseInt(profile.birthMonth),
          Number.parseInt(profile.birthDay),
          profile.gender,
          profile.name,
          profile.timeUnknown,
          false, // isLeapMonth
          undefined, // apiMonthStem
          undefined, // apiMonthBranch
          "동경135도", // timeStandard
        )

        // Update DB with recalculated saju
        const { error: updateSajuError } = await supabase
          .from("saju_sessions")
          .update({ saju: recalculatedSaju })
          .eq("id", profile.id)

        if (updateSajuError) {
          console.error("사주 데이터 저장 실패:", updateSajuError)
        } else {
          dbSaju = recalculatedSaju
        }
      }

      // Prepare final saju data for localStorage
      const finalSajuData = {
        sessionId: profile.id,
        saju: {
          ...dbSaju,
          daeun: dbDaeun,
          elements: dbSaju.elements || profile.saju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
          dayMaster: dbSaju.dayMaster || profile.saju.dayStem,
          dayMasterHanja: dbSaju.dayMasterHanja || "",
        },
        name: profile.name,
        gender: profile.gender,
        year: profile.birthYear,
        month: profile.birthMonth,
        day: profile.birthDay,
        hour: profile.birthHour,
        minute: profile.birthMinute,
        lunarYear: profile.lunarYear || profile.birthYear,
        lunarMonth: profile.lunarMonth || profile.birthMonth,
        lunarDay: profile.lunarDay || profile.birthDay,
        timeUnknown: profile.timeUnknown,
        interpretation: "",
        birthInfo: {
          solarYear: Number.parseInt(profile.birthYear),
          solarMonth: Number.parseInt(profile.birthMonth),
          solarDay: Number.parseInt(profile.birthDay),
          solarHour: Number.parseInt(profile.birthHour) || 0,
          solarMinute: Number.parseInt(profile.birthMinute) || 0,
          lunarYear: Number.parseInt(profile.lunarYear || profile.birthYear),
          lunarMonth: Number.parseInt(profile.lunarMonth || profile.birthMonth),
          lunarDay: Number.parseInt(profile.lunarDay || profile.birthDay),
          timeUnknown: profile.timeUnknown,
        },
      }

      localStorage.setItem("current_saju", JSON.stringify(finalSajuData))
      console.log("✅ Saju data prepared for chat")
    } catch (error) {
      console.error("Error preparing saju data:", error)
      toast.error("사주 데이터 준비 중 오류가 발생했습니다.")
    }
  }

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
