"use client"

import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentFailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#1b1c1e] text-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="flex justify-center">
          <XCircle size={64} className="text-[#ff6363]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">결제 실패</h1>
          <p className="text-[#aeb0b6]">결제 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.back()} className="w-full bg-[#28d0ed] text-black hover:bg-[#28d0ed]/90">
            다시 시도
          </Button>

          <Button
            onClick={() => router.push("/charge")}
            variant="outline"
            className="w-full border-[#70737c]/20 text-white hover:bg-white/5"
          >
            충전소로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}
