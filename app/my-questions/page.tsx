"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2 } from "lucide-react"

interface UserQuestion {
  id: string
  room_type: string
  question: string
  created_at: string
}

const roomTypeLabels: Record<string, string> = {
  personalized: "혜민스님의 맞춤 상담",
  career: "유재석이 풀어주는 직업운",
  love: "장도연의 애정운",
  health: "나문희의 건강운",
  business: "정용진의 사업운",
  marriage: "오은영 박사의 결혼운",
  compatibility: "신동엽의 속궁합 풀이",
}

export default function MyQuestionsPage() {
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClientComponentClient()

  const fetchQuestions = async (roomType?: string) => {
    setLoading(true)
    try {
      const url = new URL("/api/user-questions", window.location.origin)
      if (roomType && roomType !== "all") {
        url.searchParams.append("roomType", roomType)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setQuestions(data.data)
      } else {
        console.error("질문 조회 오류:", data.error)
      }
    } catch (error) {
      console.error("질문 조회 중 오류 발생:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      const url = new URL("/api/user-questions", window.location.origin)
      url.searchParams.append("id", id)

      const response = await fetch(url.toString(), {
        method: "DELETE",
      })
      const data = await response.json()

      if (data.success) {
        // 질문 목록에서 삭제된 질문 제거
        setQuestions(questions.filter((q) => q.id !== id))
      } else {
        console.error("질문 삭제 오류:", data.error)
      }
    } catch (error) {
      console.error("질문 삭제 중 오류 발생:", error)
    }
  }

  useEffect(() => {
    fetchQuestions(activeTab === "all" ? undefined : activeTab)
  }, [activeTab])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const uniqueRoomTypes = Array.from(new Set(["all", ...questions.map((q) => q.room_type)]))

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">내가 한 질문들</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          {uniqueRoomTypes
            .filter((type) => type !== "all")
            .map((type) => (
              <TabsTrigger key={type} value={type}>
                {roomTypeLabels[type] || type}
              </TabsTrigger>
            ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-8">질문을 불러오는 중...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">아직 질문이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{roomTypeLabels[question.room_type] || question.room_type}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteQuestion(question.id)}
                    aria-label="질문 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(question.created_at)}</p>
              </CardHeader>
              <CardContent>
                <p>{question.question}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
