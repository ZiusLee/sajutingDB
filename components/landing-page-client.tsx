"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, Briefcase, DollarSign, Activity, MapPin } from "lucide-react"
import { getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { calculateElementsFromSaju } from "@/lib/element-utils"
import { ElementDisplay } from "@/components/element-display"
import FloatingChatButton from "@/components/floating-chat-button"

interface SajuProfile {
  id: string
  name: string
  gender: string
  saju: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
    dayMaster?: string
    dayMasterHanja?: string
    yearAnimal?: string
    elements?: Record<string, number>
  }
}

export function LandingPageClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState("")
  const [defaultProfile, setDefaultProfile] = useState<SajuProfile | null>(null)
  const [elements, setElements] = useState<Record<string, number>>({
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  })
  const supabase = createClientComponentClient()

  // 현재 날짜 정보
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDate = today.getDate()
  const currentYear = today.getFullYear()
  const currentHour = today.getHours()
  const currentMinute = today.getMinutes()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true)

        // 사용자 인증 확인
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData?.session) {
          router.push("/login?returnUrl=/landing")
          return
        }

        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          setUser(userData.user)
          setUserName(userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "사용자")

          // 기본 사주 프로필 가져오기
          try {
            const defaultSession = await getDefaultSajuSession(userData.user.id)
            console.log("Default session:", defaultSession)

            if (defaultSession) {
              const profile = await getSajuProfileBySessionId(defaultSession.id)
              console.log("Profile:", profile)

              if (profile) {
                setDefaultProfile(profile)

                // 오행 계산
                const calculatedElements = calculateElementsFromSaju(
                  profile.saju.yearStem,
                  profile.saju.yearBranch,
                  profile.saju.monthStem,
                  profile.saju.monthBranch,
                  profile.saju.dayStem,
                  profile.saju.dayBranch,
                  profile.saju.hourStem,
                  profile.saju.hourBranch,
                )
                setElements(calculatedElements)
              }
            } else {
              console.log("No default session found")
            }
          } catch (error) {
            console.error("Error loading default profile:", error)
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  // 운세 점수에 따른 날씨 아이콘
  const getWeatherIcon = (score: number) => {
    if (score >= 80) return "☀️"
    if (score >= 60) return "⛅"
    if (score >= 40) return "☁️"
    return "🌧️"
  }

  // 운세 점수에 따른 날씨 텍스트
  const getWeatherText = (score: number) => {
    if (score >= 80) return "맑음"
    if (score >= 60) return "구름많음"
    if (score >= 40) return "흐림"
    return "비"
  }

  // 오늘의 ��세 데이터 (실제로는 사주 기반으로 계산해야 함)
  const todayFortunes = [
    {
      type: "love",
      title: "연애운",
      score: 85,
      description: "좋은 인연을 만날 수 있는 날입니다",
      icon: Heart,
    },
    {
      type: "career",
      title: "직업운",
      score: 70,
      description: "새로운 기회가 찾아올 예정입니다",
      icon: Briefcase,
    },
    {
      type: "money",
      title: "재물운",
      score: 45,
      description: "지출에 주의가 필요한 시기입니다",
      icon: DollarSign,
    },
    {
      type: "health",
      title: "건강운",
      score: 90,
      description: "컨디션이 좋은 하루가 될 것입니다",
      icon: Activity,
    },
  ]

  // 전체 운세 평균
  const averageScore = Math.round(todayFortunes.reduce((sum, f) => sum + f.score, 0) / todayFortunes.length)
  const maxScore = Math.max(...todayFortunes.map((f) => f.score))
  const minScore = Math.min(...todayFortunes.map((f) => f.score))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* 배경 구름 효과 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-16 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-12 bg-white rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-20 bg-white rounded-full blur-2xl"></div>
        <div className="absolute top-60 right-1/3 w-28 h-14 bg-white rounded-full blur-lg"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 pb-20">
        {/* 헤더 - 날씨 앱 스타일 */}
        <div className="text-center text-white mb-8 pt-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm opacity-90">서울특별시</span>
          </div>
          <h1 className="text-4xl font-light mb-2">{userName}님의 운세</h1>
          <div className="text-8xl font-thin mb-2">{averageScore}</div>
          <div className="text-xl opacity-90 mb-1">{getWeatherText(averageScore)}</div>
          <div className="text-sm opacity-75">
            H:{maxScore} L:{minScore}
          </div>
        </div>

        {/* 오늘의 운세 요약 */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30">
          <p className="text-white text-center text-sm leading-relaxed">
            오늘은 전반적으로 좋은 기운이 흐르는 날입니다. 특히 {todayFortunes.find((f) => f.score === maxScore)?.title}
            이 매우 좋습니다.
          </p>
        </div>

        {/* 시간별 운세 (날씨 앱의 시간별 예보 스타일) */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30">
          <div className="flex justify-between items-center text-white text-sm">
            <div className="text-center">
              <div className="mb-2 opacity-75">지금</div>
              <div className="text-2xl mb-2">{getWeatherIcon(averageScore)}</div>
              <div className="font-medium">{averageScore}</div>
            </div>
            <div className="text-center">
              <div className="mb-2 opacity-75">15시</div>
              <div className="text-2xl mb-2">{getWeatherIcon(78)}</div>
              <div className="font-medium">78</div>
            </div>
            <div className="text-center">
              <div className="mb-2 opacity-75">16시</div>
              <div className="text-2xl mb-2">{getWeatherIcon(82)}</div>
              <div className="font-medium">82</div>
            </div>
            <div className="text-center">
              <div className="mb-2 opacity-75">17시</div>
              <div className="text-2xl mb-2">{getWeatherIcon(75)}</div>
              <div className="font-medium">75</div>
            </div>
            <div className="text-center">
              <div className="mb-2 opacity-75">18시</div>
              <div className="text-2xl mb-2">{getWeatherIcon(68)}</div>
              <div className="font-medium">68</div>
            </div>
            <div className="text-center">
              <div className="mb-2 opacity-75">19시</div>
              <div className="text-2xl mb-2">{getWeatherIcon(72)}</div>
              <div className="font-medium">72</div>
            </div>
          </div>
        </div>

        {/* 나의 대표 사주 카드 */}
        {defaultProfile && (
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                나의 대표 사주
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => router.push("/mypage")}
              >
                상세보기
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-medium mb-2">{defaultProfile.name}님의 사주</h3>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.yearStem}</div>
                    <div className="text-xs text-white/70">년간</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.monthStem}</div>
                    <div className="text-xs text-white/70">월간</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.dayStem}</div>
                    <div className="text-xs text-white/70">일간</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.hourStem}</div>
                    <div className="text-xs text-white/70">시간</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.yearBranch}</div>
                    <div className="text-xs text-white/70">년지</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.monthBranch}</div>
                    <div className="text-xs text-white/70">월지</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.dayBranch}</div>
                    <div className="text-xs text-white/70">일지</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <div className="text-white font-medium">{defaultProfile.saju.hourBranch}</div>
                    <div className="text-xs text-white/70">시지</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-2">오행 분포</h3>
                <div className="bg-white/10 rounded-lg p-3">
                  <ElementDisplay elements={elements} maxSlots={12} />
                  <div className="mt-2 text-sm text-white/70">
                    일주: {defaultProfile.saju.dayStem}
                    {defaultProfile.saju.dayBranch}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사주가 없는 경우 */}
        {!defaultProfile && !isLoading && (
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/30 text-center">
            <h2 className="text-white font-medium mb-2">사주 정보가 없습니다</h2>
            <p className="text-white/70 text-sm mb-4">먼저 사주를 입력해주세요</p>
            <Button
              className="bg-white/30 hover:bg-white/40 text-white border-white/50"
              onClick={() => router.push("/")}
            >
              사주 입력하기
            </Button>
          </div>
        )}

        {/* 오늘의 운세 상세 카드들 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {todayFortunes.map((fortune) => (
            <div key={fortune.type} className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <fortune.icon className="h-5 w-5 text-white" />
                  <h3 className="text-white font-medium">{fortune.title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl">{getWeatherIcon(fortune.score)}</div>
                  <div className="text-xs text-white/70">{getWeatherText(fortune.score)}</div>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-3">{fortune.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fortune.score}%` }}
                  ></div>
                </div>
                <span className="text-white text-sm font-medium">{fortune.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 이번 달 운세 요약 */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30">
          <h2 className="text-white font-medium mb-4">이번 달 운세 요약 ({currentMonth}월)</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/20 rounded-lg">
              <span className="text-white font-medium">전체 운세</span>
              <span className="text-white font-semibold">상승세 📈</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-500/30 rounded-lg text-center">
                <div className="text-white/70 text-sm">길한 날</div>
                <div className="text-white font-bold">{currentMonth}월 15일</div>
              </div>
              <div className="p-3 bg-orange-500/30 rounded-lg text-center">
                <div className="text-white/70 text-sm">주의할 날</div>
                <div className="text-white font-bold">{currentMonth}월 23일</div>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            className="h-16 bg-white/30 hover:bg-white/40 text-white border-white/50"
            onClick={() => router.push("/daily-fortune")}
          >
            <div className="text-center">
              <div className="text-lg">🎰</div>
              <div className="text-sm">오늘의 운세</div>
            </div>
          </Button>
          <Button
            className="h-16 bg-white/30 hover:bg-white/40 text-white border-white/50"
            onClick={() => router.push("/chat-list")}
          >
            <div className="text-center">
              <div className="text-lg">💬</div>
              <div className="text-sm">AI 상담</div>
            </div>
          </Button>
        </div>
      </div>

      {/* 플로팅 채팅 버튼 */}
      <FloatingChatButton defaultProfile={defaultProfile} />
    </div>
  )
}
