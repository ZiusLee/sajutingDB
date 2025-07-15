"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface TalismanCollectionProps {
  talismans: string[]
}

// 부적 정보
const TALISMAN_INFO = [
  {
    id: "love_talisman",
    name: "연애 부적",
    description: "연애 운을 높여줍니다",
    icon: "💖",
    color: "bg-pink-100 border-pink-300",
  },
  {
    id: "money_talisman",
    name: "재물 부적",
    description: "금전 운을 높여줍니다",
    icon: "💰",
    color: "bg-yellow-100 border-yellow-300",
  },
  {
    id: "career_talisman",
    name: "직업 부적",
    description: "직업 운을 높여줍니다",
    icon: "💼",
    color: "bg-blue-100 border-blue-300",
  },
  {
    id: "business_talisman",
    name: "사업 부적",
    description: "사업 운을 높여줍니다",
    icon: "📈",
    color: "bg-green-100 border-green-300",
  },
  {
    id: "health_talisman",
    name: "건강 부적",
    description: "건강 운을 높여줍니다",
    icon: "💪",
    color: "bg-purple-100 border-purple-300",
  },
  {
    id: "special_talisman",
    name: "특별 부적",
    description: "모든 운을 높여줍니다",
    icon: "✨",
    color: "bg-amber-100 border-amber-300",
  },
]

// 모든 부적 ID 목록
const ALL_TALISMAN_IDS = TALISMAN_INFO.map((t) => t.id)

export function TalismanCollection({ talismans }: TalismanCollectionProps) {
  // 보유한 부적 수
  const collectedCount = talismans.length
  // 전체 부적 수
  const totalCount = TALISMAN_INFO.length
  // 수집률
  const collectionRate = Math.round((collectedCount / totalCount) * 100)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">나의 부적 컬렉션</h3>
        <p className="text-sm text-muted-foreground">
          {collectedCount}개 수집 / 전체 {totalCount}개 ({collectionRate}%)
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${collectionRate}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ALL_TALISMAN_IDS.map((talismanId) => {
          const isCollected = talismans.includes(talismanId)
          const talismanInfo = TALISMAN_INFO.find((t) => t.id === talismanId) || {
            name: "알 수 없는 부적",
            description: "정보가 없습니다",
            icon: "❓",
            color: "bg-gray-100 border-gray-300",
          }

          return (
            <motion.div key={talismanId} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card className={`border-2 ${isCollected ? talismanInfo.color : "bg-gray-50 border-gray-200"}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{isCollected ? talismanInfo.icon : "🔒"}</div>
                  <h4 className="font-medium text-sm">{isCollected ? talismanInfo.name : "미수집 부적"}</h4>
                  {isCollected && (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">{talismanInfo.description}</p>
                      <Badge variant="outline" className="mt-2">
                        수집 완���
                      </Badge>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
