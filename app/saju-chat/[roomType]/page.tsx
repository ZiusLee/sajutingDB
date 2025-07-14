"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import SajuChat from "@/components/saju-chat"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
// 파일 상단에 URL 유틸리티 함수 import 추가
import { addSajuToUrl, loadSajuFromLocalStorage } from "@/lib/url-utils"

export default function SajuChatPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [saju, setSaju] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionKey, setSessionKey] = useState<string>("")

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

      // Generate a unique session key for this chat room
      const generatedKey = `chat_${parsedSaju.name || "user"}_${params.roomType}`
      setSessionKey(generatedKey)

      // 원래 경로 저장 (있는 경우)
      const lastChatData = loadSajuFromLocalStorage("last_chat_saju_data")
      if (lastChatData && lastChatData.returnPath) {
        localStorage.setItem("chat_return_path", lastChatData.returnPath)
      }

      // 마이페이지에서 왔는지 확인 (더 안전하게)
      const fromMyPage = sessionStorage.getItem("from_mypage")
      console.log("from_mypage flag:", fromMyPage)
      if (fromMyPage === "true") {
        console.log("Chat opened from mypage - flag confirmed")
        // 플래그는 saju-chat 컴포넌트에서 처리하므로 여기서는 제거하지 않음
      }

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
  }, [router, toast, params.roomType])

  const handleBack = () => {
    try {
      // 저장된 원래 경로가 있으면 그 경로로 이동
      const savedReturnPath = localStorage.getItem("chat_return_path")

      if (savedReturnPath) {
        // 사주 데이터가 있는지 확인
        if (saju) {
          // URL 유틸리티 함수를 사용하여 사주 데이터를 URL에 추가
          const urlWithSaju = addSajuToUrl(savedReturnPath, saju.saju, saju.name, saju.gender)

          router.push(urlWithSaju)
        } else {
          router.push(savedReturnPath)
        }
      } else if (saju) {
        // 사주 데이터가 있으면 결과 페이지로 이동
        const sajuParam = encodeURIComponent(JSON.stringify(saju.saju))
        const nameParam = saju.name ? `&name=${encodeURIComponent(saju.name)}` : ""
        const genderParam = saju.gender ? `&gender=${encodeURIComponent(saju.gender)}` : ""

        router.push(`/result?saju=${sajuParam}${nameParam}${genderParam}`)
      } else {
        router.push("/chat-list")
      }
    } catch (error) {
      console.error("Error in handleBack:", error)
      router.push("/chat-list")
    }
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
        sessionKey={sessionKey}
        birthInfo={saju.birthInfo}
        concerns={saju.concerns || []}
      />
    </div>
  )
}
