"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Star } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

interface FortuneSlotMachineProps {
  coins: number
  useCoins: (amount: number) => Promise<boolean>
  addTalisman: (talismanId: string) => Promise<void>
}

// 운세 카테고리
const FORTUNE_CATEGORIES = [
  { id: "love", name: "연애운", color: "bg-pink-500", textColor: "text-pink-500", icon: "💖" },
  { id: "money", name: "금전운", color: "bg-yellow-500", textColor: "text-yellow-500", icon: "💰" },
  { id: "career", name: "직업운", color: "bg-blue-500", textColor: "text-blue-500", icon: "💼" },
  { id: "business", name: "사업운", color: "bg-green-500", textColor: "text-green-500", icon: "📈" },
  { id: "health", name: "건강운", color: "bg-purple-500", textColor: "text-purple-500", icon: "💪" },
]

// 운세 결과 레벨
const FORTUNE_LEVELS = [
  { id: "very_bad", name: "매우 나쁨", color: "text-red-600", emoji: "😱" },
  { id: "bad", name: "나쁨", color: "text-orange-500", emoji: "😟" },
  { id: "neutral", name: "보통", color: "text-yellow-500", emoji: "😐" },
  { id: "good", name: "좋음", color: "text-green-500", emoji: "😊" },
  { id: "very_good", name: "매우 좋���", color: "text-blue-500", emoji: "🤩" },
]

// 운세 메시지
const FORTUNE_MESSAGES = {
  love: {
    very_bad: "오늘은 연애 운이 매우 좋지 않습니다. 감정적인 대화는 피하는 것이 좋겠습니다.",
    bad: "오늘은 연애 운이 다소 좋지 않습니다. 상대방의 말에 귀 기울이는 것이 중요합니다.",
    neutral: "오늘의 연애 운은 평범합니다. 평소와 같이 행동하세요.",
    good: "오늘은 연애 운이 좋습니다. 마음에 드는 사람에게 다가가보세요.",
    very_good: "오늘은 연애 운이 매우 좋습니다! 고백이나 데이트 신청에 좋은 날입니다.",
  },
  money: {
    very_bad: "오늘은 금전 운이 매우 좋지 않습니다. 불필요한 지출은 피하세요.",
    bad: "오늘은 금전 운이 다소 좋지 않습니다. 충동구매를 자제하세요.",
    neutral: "오늘의 금전 운은 평범합니다. 계획적인 소비를 하세요.",
    good: "오늘은 금전 운이 좋습니다. 투자나 재테크에 좋은 날입니다.",
    very_good: "오늘은 금전 운이 매우 좋습니다! 예상치 못한 수입이 있을 수 있습니다.",
  },
  career: {
    very_bad: "오늘은 직업 운이 매우 좋지 않습니다. 중요한 결정은 미루는 것이 좋겠습니다.",
    bad: "오늘은 직업 운이 다소 좋지 않습니다. 실수하지 않도록 주의하세요.",
    neutral: "오늘의 직업 운은 평범합니다. 맡은 일에 충실하세요.",
    good: "오늘은 직업 운이 좋습니다. 업무에서 좋은 성과를 낼 수 있습니다.",
    very_good: "오늘은 직업 운이 매우 좋습니다! 승진이나 좋은 기회가 올 수 있습니다.",
  },
  business: {
    very_bad: "오늘은 사업 운이 매우 좋지 않습니다. 중요한 계약이나 미팅은 연기하세요.",
    bad: "오늘은 사업 운이 다소 좋지 않습니다. 신중하게 결정하세요.",
    neutral: "오늘의 사업 운은 평범합니다. 기본에 충실하세요.",
    good: "오늘은 사업 운이 좋습니다. 새로운 아이디어를 실행에 옮겨보세요.",
    very_good: "오늘은 사업 운이 매우 좋습니다! 새로운 거래나 파트너십에 좋은 날입니다.",
  },
  health: {
    very_bad: "오늘은 건강 운이 매우 좋지 않습니다. 무리한 활동은 피하고 충분한 휴식을 취하세요.",
    bad: "오늘은 건강 운이 다소 좋지 않습니다. 건강에 신경 쓰세요.",
    neutral: "오늘의 건강 운은 평범합니다. 규칙적인 생활을 유지하세요.",
    good: "오늘은 건강 운이 좋습니다. 가벼운 운동을 해보세요.",
    very_good: "오늘은 건강 운이 매우 좋습니다! 활력이 넘치는 하루가 될 것입니다.",
  },
}

export function FortuneSlotMachine({ coins, useCoins, addTalisman }: FortuneSlotMachineProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(FORTUNE_CATEGORIES[0].id)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [fortuneResult, setFortuneResult] = useState<string | null>(null)
  const [leverPulled, setLeverPulled] = useState(false)
  const [capsuleVisible, setCapsuleVisible] = useState(false)
  const [capsulePosition, setCapsulePosition] = useState(0)
  const [capsuleRotation, setCapsuleRotation] = useState(0)
  const [result, setResult] = useState<{
    category: string
    level: string
    message: string
    talisman: string | null
  } | null>(null)

  const machineRef = useRef<HTMLDivElement>(null)
  const leverRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

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
  }, [])

  const pullLever = async () => {
    if (isSpinning || coins < 1) return

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

        // 결과 생성 및 표시
        setTimeout(() => {
          // 캡슐 숨기기
          setCapsuleVisible(false)

          const levelIndex = Math.floor(Math.random() * FORTUNE_LEVELS.length)
          const level = FORTUNE_LEVELS[levelIndex].id
          const message =
            FORTUNE_MESSAGES[selectedCategory as keyof typeof FORTUNE_MESSAGES][
              level as keyof typeof FORTUNE_MESSAGES.love
            ]

          // 부적 획득 확률 (20%)
          const getTalisman = Math.random() < 0.2
          let talismanId = null

          if (getTalisman) {
            // 해당 카테고리의 부적
            talismanId = `${selectedCategory}_talisman`
            addTalisman(talismanId)
          }

          setResult({
            category: selectedCategory,
            level,
            message,
            talisman: talismanId,
          })

          // 결과 팝업 표시
          setShowResult(true)
          setIsSpinning(false)

          // 좋은 결과일 경우 축하 효과
          if (level === "good" || level === "very_good") {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          }
        }, 2000) // 2초 후 결과 표시
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
        {isSpinning && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex justify-center items-center z-10">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        )}
      </div>

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              {categoryInfo.name} 결과
              <Star className="h-5 w-5 text-yellow-500 ml-2" />
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="mt-4 text-center space-y-4">
              <div className="text-4xl mb-2">{FORTUNE_LEVELS.find((l) => l.id === result.level)?.emoji}</div>

              <p className={`text-lg font-semibold ${FORTUNE_LEVELS.find((l) => l.id === result.level)?.color}`}>
                {FORTUNE_LEVELS.find((l) => l.id === result.level)?.name}
              </p>

              <p className="text-gray-700 dark:text-gray-300">{result.message}</p>

              {result.talisman && (
                <motion.div
                  className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    🎉 축하합니다! 부적을 획득했습니다!
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
