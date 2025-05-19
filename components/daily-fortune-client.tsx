"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { FortuneSlotMachine } from "./fortune-slot-machine-gpt"
import { TalismanCollection } from "./talisman-collection"

export default function DailyFortuneClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [defaultSession, setDefaultSession] = useState<any>(null)
  const [sajuProfile, setSajuProfile] = useState<any>(null)
  const [coins, setCoins] = useState(0)
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null)
  const [talismans, setTalismans] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("fortune")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          const { data: userData } = await supabase.auth.getUser()
          setUser(userData.user)
          await loadUserData(userData.user.id)
        } else {
          // 로그인 페이지로 리디렉션
          window.location.href = "/login?redirect=/daily-fortune"
        }
      } catch (error) {
        console.error("Authentication error:", error)
        toast({
          title: "인증 오류",
          description: "로그인 정보를 확인하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, toast])

  const loadUserData = async (userId: string) => {
    try {
      // 사용자의 대표 사주 세션 가져오기 (lib/saju-session-service.ts 활용)
      const defaultSession = await getDefaultSajuSession(userId)

      if (!defaultSession) {
        // 대표 사주가 없으면 사주 세션 목록 가져오기
        const { data: sessions, error: sessionsError } = await supabase
          .from("saju_sessions")
          .select("*")
          .eq("auth_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (sessionsError || !sessions || sessions.length === 0) {
          toast({
            title: "사주 정보 없음",
            description: "사주 정보를 먼저 등록해주세요.",
          })
          return
        }

        setDefaultSession(sessions[0])

        // 사주 프로필 정보 가져오기
        const profile = await getSajuProfileBySessionId(sessions[0].id)
        setSajuProfile(profile)
      } else {
        setDefaultSession(defaultSession)

        // 사주 프로필 정보 가져오기
        const profile = await getSajuProfileBySessionId(defaultSession.id)
        setSajuProfile(profile)
      }

      // 코인 정보 로드
      const { data: coinData, error: coinError } = await supabase
        .from("user_coins")
        .select("coins, last_check_in")
        .eq("user_id", userId)
        .single()

      if (coinError) {
        if (coinError.code === "PGRST116") {
          // 데이터가 없는 경우 새로 생성
          const { data: newCoinData, error: insertError } = await supabase
            .from("user_coins")
            .insert({ user_id: userId, coins: 0 })
            .select()
            .single()

          if (insertError) throw insertError
          setCoins(0)
          setLastCheckIn(null)
        } else {
          throw coinError
        }
      } else {
        setCoins(coinData.coins)
        setLastCheckIn(coinData.last_check_in)
      }

      // 부적 정보 로드
      const { data: talismanData, error: talismanError } = await supabase
        .from("user_talismans")
        .select("talisman_ids")
        .eq("user_id", userId)
        .single()

      if (talismanError) {
        if (talismanError.code === "PGRST116") {
          // 데이터가 없는 경우 새로 생성
          const { error: insertError } = await supabase
            .from("user_talismans")
            .insert({ user_id: userId, talisman_ids: [] })

          if (insertError) throw insertError
          setTalismans([])
        } else {
          throw talismanError
        }
      } else {
        setTalismans(talismanData.talisman_ids || [])
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error)
      toast({
        title: "데이터 로드 오류",
        description: "사용자 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const checkInForCoins = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]

      // 이미 오늘 출석 체크를 했는지 확인
      if (lastCheckIn === today) {
        toast({
          title: "이미 출석 체크를 완료했습니다",
          description: "내일 다시 방문해주세요!",
        })
        return
      }

      // 코인 업데이트
      const { error } = await supabase
        .from("user_coins")
        .update({
          coins: coins + 1,
          last_check_in: today,
        })
        .eq("user_id", user.id)

      if (error) throw error

      setCoins(coins + 1)
      setLastCheckIn(today)

      toast({
        title: "출석 체크 완료!",
        description: "코인 1개가 지급되었습니다.",
      })
    } catch (error) {
      console.error("출석 체크 오류:", error)
      toast({
        title: "출석 체크 오류",
        description: "코인을 지급하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const useCoins = async (amount = 1) => {
    if (!user || coins < amount) return false

    try {
      const { error } = await supabase
        .from("user_coins")
        .update({ coins: coins - amount })
        .eq("user_id", user.id)

      if (error) throw error

      setCoins(coins - amount)
      return true
    } catch (error) {
      console.error("코인 사용 오류:", error)
      toast({
        title: "코인 사용 오류",
        description: "코인을 사용하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      return false
    }
  }

  const addTalisman = async (talismanId: string) => {
    if (!user) return

    try {
      // 이미 가지고 있는 부적인지 확인
      if (talismans.includes(talismanId)) {
        toast({
          title: "이미 보유한 부적입니다",
          description: "다른 부적을 모아보세요!",
        })
        return
      }

      const updatedTalismans = [...talismans, talismanId]

      const { error } = await supabase
        .from("user_talismans")
        .update({ talisman_ids: updatedTalismans })
        .eq("user_id", user.id)

      if (error) throw error

      setTalismans(updatedTalismans)

      toast({
        title: "새로운 부적을 획득했습니다!",
        description: "부적 컬렉션에서 확인해보세요.",
      })
    } catch (error) {
      console.error("부적 추가 오류:", error)
      toast({
        title: "부적 추가 오류",
        description: "부적을 추가하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg">로딩 중...</p>
      </div>
    )
  }

  if (!sajuProfile) {
    return (
      <div className="container max-w-md mx-auto p-4 pb-20">
        <Alert className="mb-4">
          <AlertTitle>사주 정보가 필요합니다</AlertTitle>
          <AlertDescription>
            오늘의 운세를 보려면 먼저 사주 정보를 등록해주세요.
            <div className="mt-4">
              <Button onClick={() => (window.location.href = "/")}>사주 등록하러 가기</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto p-4 pb-20 bg-gray-950">
      <Card className="mb-4 bg-gray-900 border-amber-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-amber-400">오늘의 운세</CardTitle>
          <CardDescription className="text-center text-amber-300/70">
            레버를 당겨 오늘의 운세를 확인하세요!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-amber-400 text-lg font-bold mr-2">🪙 {coins}</span>
              <span className="text-sm text-gray-400">코인</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkInForCoins}
              disabled={lastCheckIn === new Date().toISOString().split("T")[0]}
              className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
            >
              {lastCheckIn === new Date().toISOString().split("T")[0] ? "출석 완료" : "출석 체크"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="fortune" className="data-[state=active]:bg-gray-700">
            운세 보기
          </TabsTrigger>
          <TabsTrigger value="talismans" className="data-[state=active]:bg-gray-700">
            부적 컬렉션
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fortune">
          <Card className="bg-gray-900 border-amber-800">
            <CardContent className="pt-6">
              <FortuneSlotMachine
                coins={coins}
                useCoins={useCoins}
                addTalisman={addTalisman}
                sajuProfile={sajuProfile}
                userId={user?.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="talismans">
          <Card className="bg-gray-900 border-amber-800">
            <CardContent className="pt-6">
              <TalismanCollection talismans={talismans} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Card className="bg-gray-900 border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-400">사주 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-amber-300">기본 정보</h3>
                <Separator className="my-2 bg-amber-800/50" />
                <p className="text-gray-300">이름: {sajuProfile.name || "이름 없음"}</p>
                <p className="text-gray-300">성별: {sajuProfile.gender === "male" ? "남성" : "여성"}</p>
              </div>
              <div>
                <h3 className="font-medium text-amber-300">사주 정보</h3>
                <Separator className="my-2 bg-amber-800/50" />
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-gray-800 p-2 rounded-md">
                    <p className="text-xs text-amber-300">년주</p>
                    <p className="text-gray-300">
                      {sajuProfile.saju.yearStem}
                      {sajuProfile.saju.yearBranch}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded-md">
                    <p className="text-xs text-amber-300">월주</p>
                    <p className="text-gray-300">
                      {sajuProfile.saju.monthStem}
                      {sajuProfile.saju.monthBranch}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded-md">
                    <p className="text-xs text-amber-300">일주</p>
                    <p className="text-gray-300">
                      {sajuProfile.saju.dayStem}
                      {sajuProfile.saju.dayBranch}
                    </p>
                  </div>
                  <div className="bg-gray-800 p-2 rounded-md">
                    <p className="text-xs text-amber-300">시주</p>
                    <p className="text-gray-300">
                      {sajuProfile.saju.hourStem}
                      {sajuProfile.saju.hourBranch}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
