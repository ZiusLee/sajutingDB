"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import ReactMarkdown from "react-markdown"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Progress } from "@/components/ui/progress"

interface FortuneSlotMachineProps {
  coins: number
  useCoins: (amount: number) => Promise<boolean>
  addTalisman: (talismanId: string) => Promise<void>
  sajuProfile: any
  userId: string
}

// 운세 카테고리
const FORTUNE_CATEGORIES = [
  { id: "love", name: "연애운", color: "bg-pink-500", textColor: "text-pink-500", icon: "💖" },
  { id: "money", name: "금전운", color: "bg-yellow-500", textColor: "text-yellow-500", icon: "💰" },
  { id: "career", name: "직업운", color: "bg-blue-500", textColor: "text-blue-500", icon: "💼" },
  { id: "business", name: "사업운", color: "bg-green-500", textColor: "text-green-500", icon: "📈" },
  { id: "health", name: "건강운", color: "bg-purple-500", textColor: "text-purple-500", icon: "💪" },
]

// 예상 로딩 시간 (밀리초)
const ESTIMATED_LOADING_TIME = 15000

export function FortuneSlotMachine({ coins, useCoins, addTalisman, sajuProfile, userId }: FortuneSlotMachineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(FORTUNE_CATEGORIES[0].id)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [leverPulled, setLeverPulled] = useState(false)
  const [capsuleVisible, setCapsuleVisible] = useState(false)
  const [capsulePosition, setCapsulePosition] = useState(0)
  const [capsuleRotation, setCapsuleRotation] = useState(0)
  const [result, setResult] = useState<{
    category: string
    fortune: string
    talisman: string | null
  } | null>(null)
  const [fortuneCache, setFortuneCache] = useState<Record<string, { fortune: string; date: string }>>({})

  // 로딩 애니메이션을 위한 상태
  const [showBigCapsule, setShowBigCapsule] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [loadingStartTime, setLoadingStartTime] = useState(0)

  const machineRef = useRef<HTMLDivElement>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // 별 애니메이션을 위한 상태
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([])

  useEffect(() => {
    // 별 생성
    const newStars = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 3,
    }))
    setStars(newStars)

    // 캐시된 운세 로드
    loadCachedFortunes()
  }, [])

  // 로딩 진행 상태 업데이트
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (showBigCapsule && loadingStartTime > 0) {
      intervalId = setInterval(() => {
        const elapsed = Date.now() - loadingStartTime
        const progress = Math.min(Math.floor((elapsed / ESTIMATED_LOADING_TIME) * 100), 99)
        const remaining = Math.max(Math.ceil((ESTIMATED_LOADING_TIME - elapsed) / 1000), 1)

        setLoadingProgress(progress)
        setRemainingTime(remaining)

        // 99%에서 멈추고 실제 완료는 API 응답에서 처리
        if (progress >= 99) {
          clearInterval(intervalId as NodeJS.Timeout)
        }
      }, 100)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [showBigCapsule, loadingStartTime])

  const loadCachedFortunes = async () => {
    try {
      // 오늘 날짜
      const today = new Date().toISOString().split("T")[0]

      // 오늘 생성된 운세 가져오기
      const { data: fortuneData, error } = await supabase
        .from("daily_fortunes")
        .select("*")
        .eq("user_id", userId)
        .eq("fortune_date", today)

      if (!error && fortuneData && fortuneData.length > 0) {
        const cache: Record<string, { fortune: string; date: string }> = {}

        fortuneData.forEach((item) => {
          if (item.category) {
            cache[item.category] = {
              fortune: item.fortune,
              date: today,
            }
          }
        })

        setFortuneCache(cache)
      }
    } catch (error) {
      console.error("캐시된 운세 로드 오류:", error)
    }
  }

  const generateFortune = async () => {
    try {
      const response = await fetch("/api/daily-fortune", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saju: sajuProfile.saju,
          name: sajuProfile.name || "사용자",
          gender: sajuProfile.gender || "male",
          category: selectedCategory,
        }),
      })

      if (!response.ok) {
        throw new Error("운세 생성에 실패했습니다")
      }

      const data = await response.json()
      return data.interpretation
    } catch (error) {
      console.error("운세 생성 오류:", error)
      throw error
    }
  }

  const saveFortune = async (fortuneText: string) => {
    try {
      // 오늘 날짜
      const today = new Date().toISOString()
      const todayDate = today.split("T")[0]

      // 데이터베이스에 저장
      await supabase.from("daily_fortunes").insert({
        user_id: userId,
        session_id: sajuProfile.sessionId,
        fortune: fortuneText,
        created_at: today,
        fortune_date: todayDate,
        category: selectedCategory,
      })
    } catch (error) {
      console.error("운세 저장 오류:", error)
    }
  }

  const pullLever = async () => {
    if (isSpinning || coins < 1) return

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0]

    // 이미 오늘 해당 카테고리의 운세를 뽑았는지 확인
    if (fortuneCache[selectedCategory] && fortuneCache[selectedCategory].date === today) {
      // 이미 뽑은 운세가 있으면 그것을 보여줌
      setResult({
        category: selectedCategory,
        fortune: fortuneCache[selectedCategory].fortune,
        talisman: null, // 이미 뽑은 경우 부적은 없음
      })
      setShowResult(true)
      return
    }

    const success = await useCoins(1)
    if (!success) {
      toast({
        title: "코인이 부족합니다",
        description: "출석 체크를 통해 코인을 획득하세요.",
        variant: "destructive",
      })
      return
    }

    // 레버 당기기 애니메이션
    setLeverPulled(true)
    setIsSpinning(true)
    setResult(null)

    // 1초 후 레버 원위치
    setTimeout(() => {
      setLeverPulled(false)

      // 캡슐 보이기
      setCapsuleVisible(true)

      // 캡슐이 떨어지는 애니메이션
      setTimeout(() => {
        setCapsulePosition(100)
        setCapsuleRotation(720)

        // 캡슐이 떨어진 후 큰 캡슐 애니메이션 시작
        setTimeout(() => {
          setCapsuleVisible(false)
          setShowBigCapsule(true)
          setLoadingStartTime(Date.now())
          setLoadingProgress(0)
          setRemainingTime(Math.ceil(ESTIMATED_LOADING_TIME / 1000))

          // GPT API 호출하여 운세 생성
          generateFortune()
            .then((fortuneText) => {
              // 로딩 완료 표시
              setLoadingProgress(100)
              setRemainingTime(0)

              // 잠시 후 큰 캡슐 숨기기
              setTimeout(() => {
                setShowBigCapsule(false)

                // 부적 획득 확률 (20%)
                const getTalisman = Math.random() < 0.2
                let talismanId = null

                if (getTalisman) {
                  // 해당 카테고리의 부적
                  talismanId = `${selectedCategory}_talisman`
                  addTalisman(talismanId)
                }

                // 결과 설정
                const newResult = {
                  category: selectedCategory,
                  fortune: fortuneText,
                  talisman: talismanId,
                }

                setResult(newResult)

                // 캐시에 저장
                setFortuneCache((prev) => ({
                  ...prev,
                  [selectedCategory]: {
                    fortune: fortuneText,
                    date: today,
                  },
                }))

                // 결과 팝업 표시
                setShowResult(true)
                setIsSpinning(false)

                // 데이터베이스에 저장
                saveFortune(fortuneText)

                // 축하 효과
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                })
              }, 1000)
            })
            .catch((error) => {
              console.error("운세 생성 오류:", error)
              setIsSpinning(false)
              setShowBigCapsule(false)
              toast({
                title: "운세 생성 오류",
                description: "운세를 생성하는 중 오류가 발생했습니다.",
                variant: "destructive",
              })
            })
        }, 1000) // 캡슐이 떨어진 후 1초 후에 큰 캡슐 애니메이션 시작
      }, 300)
    }, 1000)
  }

  const categoryInfo = FORTUNE_CATEGORIES.find((c) => c.id === selectedCategory) || FORTUNE_CATEGORIES[0]

  return (
    <div className="relative">
      {/* 별 애니메이션 배경 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute text-yellow-300"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              fontSize: `${star.size}rem`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3,
              delay: star.delay,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* 카테고리 선택 */}
      <div className="mb-6">
        <div className="grid grid-cols-5 gap-2">
          {FORTUNE_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`flex flex-col items-center py-2 px-1 h-auto ${
                selectedCategory === category.id ? category.color : "bg-gray-800"
              }`}
              onClick={() => setSelectedCategory(category.id)}
              disabled={isSpinning}
            >
              <span className="text-xl mb-1">{category.icon}</span>
              <span className="text-xs">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 가챠 머신 */}
      <div
        ref={machineRef}
        className="relative w-full h-96 mb-6 rounded-lg overflow-hidden bg-gray-900 border-4 border-amber-700"
      >
        {/* 머신 상단 */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-amber-800 flex items-center justify-center">
          <div className="text-white font-bold text-lg">{categoryInfo.name} 운세 머신</div>
        </div>

        {/* 머신 유리창 */}
        <div className="absolute top-16 left-6 right-20 bottom-20 bg-black bg-opacity-70 rounded-md border-2 border-amber-600 overflow-hidden">
          {/* 내부 장식 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 opacity-20"></div>
          </div>

          {/* 캡슐 애니메이션 */}
          <AnimatePresence>
            {capsuleVisible && (
              <motion.div
                className={`absolute left-1/2 -translate-x-1/2 w-20 h-20 flex items-center justify-center`}
                initial={{ top: "-20%", rotate: 0 }}
                animate={{
                  top: `${capsulePosition}%`,
                  rotate: capsuleRotation,
                }}
                transition={{
                  top: { duration: 2, ease: "easeIn" },
                  rotate: { duration: 2, ease: "linear" },
                }}
              >
                <div
                  className={`w-full h-full rounded-full ${categoryInfo.color} flex items-center justify-center shadow-lg border-2 border-white border-opacity-30`}
                >
                  <span className="text-3xl">{categoryInfo.icon}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 별 효과 */}
          <AnimatePresence>
            {isSpinning && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={`spin-star-${i}`}
                    className="absolute text-yellow-300 text-xl"
                    initial={{
                      opacity: 0,
                      x: Math.random() * 100 - 50 + "%",
                      y: Math.random() * 100 + "%",
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 2,
                      delay: Math.random() * 2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 머신 하단 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-amber-800 flex items-center justify-center">
          <div className="w-40 h-10 bg-amber-900 rounded-md flex items-center justify-center">
            <div className="w-32 h-6 bg-black rounded-sm"></div>
          </div>
        </div>

        {/* 코인 투입구 */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-amber-900 rounded-md flex items-center justify-center">
          <div className="w-12 h-2 bg-black rounded-sm"></div>
        </div>

        {/* 레버 */}
        <motion.div
          ref={leverRef}
          className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center"
          animate={{
            rotateZ: leverPulled ? 30 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
          }}
        >
          <div
            className="w-10 h-10 rounded-full bg-red-600 border-4 border-amber-900 shadow-lg cursor-pointer"
            onClick={pullLever}
          ></div>
          <div className="w-4 h-32 bg-amber-900 rounded-b-lg"></div>
        </motion.div>

        {/* 장식 */}
        <div className="absolute top-20 right-6 w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-600"></div>
        <div className="absolute top-32 right-6 w-8 h-8 rounded-full bg-red-400 border-2 border-red-600"></div>

        {/* 로딩 오버레이 */}
        {isSpinning && !showBigCapsule && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center z-10">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* 큰 캡슐 로딩 애니메이션 */}
      <AnimatePresence>
        {showBigCapsule && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 큰 캡슐 */}
            <motion.div
              className="relative"
              initial={{ y: -200, scale: 0.5 }}
              animate={{
                y: 0,
                scale: 1,
                rotate: 360 * 5,
              }}
              transition={{
                y: { duration: 1, ease: "easeOut" },
                scale: { duration: 1, ease: "easeOut" },
                rotate: { duration: 20, ease: "linear", repeat: Number.POSITIVE_INFINITY },
              }}
            >
              <div
                className={`w-40 h-40 rounded-full ${categoryInfo.color} flex items-center justify-center shadow-lg border-4 border-white border-opacity-50`}
              >
                <span className="text-6xl">{categoryInfo.icon}</span>
              </div>

              {/* 빛나는 효과 */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            </motion.div>

            {/* 로딩 메시지 */}
            <div className="mt-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">오늘의 운세가 모이고 있습니다</h3>
              <p className="text-gray-300 mb-4">잠시만 기다려주세요... (약 {remainingTime}초 남음)</p>

              {/* 프로그레스 바 */}
              <div className="w-64 mx-auto">
                <Progress value={loadingProgress} className="h-2" />
              </div>

              {/* 별 효과 */}
              <div className="relative h-20 w-full mt-4">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`loading-star-${i}`}
                    className="absolute text-yellow-300 text-xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: Math.random() * 2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 버튼 */}
      <Button
        onClick={pullLever}
        disabled={isSpinning || coins < 1}
        size="lg"
        className="w-full h-12 text-lg font-bold bg-amber-600 hover:bg-amber-700"
      >
        {isSpinning ? "운세 뽑는 중..." : `레버를 당겨 운세 뽑기 (코인 ${coins}개 보유)`}
      </Button>

      {/* 결과 팝업 */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              {categoryInfo.name} 결과
              <Star className="h-5 w-5 text-yellow-500 ml-2" />
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="mt-4 space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result.fortune}</ReactMarkdown>
              </div>

              {result.talisman && (
                <motion.div
                  className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    🎉 축하합니다! 부적을 획득했습���다!
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{categoryInfo.name} 부적</p>
                </motion.div>
              )}

              <Button onClick={() => setShowResult(false)} className={`mt-4 px-8 ${categoryInfo.color}`}>
                확인
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
