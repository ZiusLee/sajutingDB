"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import SajuChat from "@/components/saju-chat"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function SajuChatPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [saju, setSaju] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    try {
      // 로컬 스토리지에서 사주 데이터 가져오기
      const savedSaju = localStorage.getItem("current_saju")

      if (!savedSaju) {
        toast({
          title: "사주 정보가 없습니다",
          description: "먼저 사주를 입력해주세요.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      const parsedSaju = JSON.parse(savedSaju)
      setSaju(parsedSaju)
      setLoading(false)

      // 로그인 상태 확인
      // 실제 구현에서는 세션이나 토큰을 확인하는 로직으로 대체
      const userToken = localStorage.getItem("user_token")
      setIsLoggedIn(!!userToken)
    } catch (error) {
      console.error("Error loading saju data:", error)
      toast({
        title: "데이터 로딩 오류",
        description: "사주 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      router.push("/")
    }
  }, [router, toast])

  const handleBack = () => {
    router.push("/chatlist")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <SajuChat
        saju={saju.saju}
        name={saju.name || "사용자"}
        gender={saju.gender || "남"}
        initialInterpretation={saju.interpretation || ""}
        roomType={params.roomType as string}
        onBack={handleBack}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
