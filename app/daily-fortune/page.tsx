import type { Metadata } from "next"
import DailyFortuneClient from "@/components/daily-fortune-client"

export const metadata: Metadata = {
  title: "오늘의 운세 | 사주핑",
  description: "오늘의 운세를 슬롯 머신으로 확인해보세요. 매일 무료 코인을 받고 다양한 운세를 확인할 수 있습니다.",
}

export default function DailyFortunePage() {
  return <DailyFortuneClient />
}
