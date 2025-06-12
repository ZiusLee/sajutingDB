"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trash2, BookOpen, MessageSquare, Calendar, Clock, Tag, Plus } from "lucide-react"
import MemoryDiary from "@/components/memory-diary"

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

export default function PersonalSpacePage() {
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [user, setUser] = useState<any>(null)
  const [showMemoryDiary, setShowMemoryDiary] = useState(false)
  const supabase = createClientComponentClient()

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [supabase])

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

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">로그인이 필요한 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">개인 공간</h1>
        <Button onClick={() => setShowMemoryDiary(true)} className="bg-purple-600 hover:bg-purple-700">
          <BookOpen className="h-4 w-4 mr-2" />
          메모리 다이어리
        </Button>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="questions" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>질문 목록</span>
            <Badge variant="secondary" className="ml-1">
              {questions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="diary" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>메모리 다이어리</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">내가 한 질문들</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                {uniqueRoomTypes
                  .filter((type) => type !== "all")
                  .slice(0, 3)
                  .map((type) => (
                    <TabsTrigger key={type} value={type} className="text-xs">
                      {roomTypeLabels[type]?.split(" ")[0] || type}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="mt-2 text-muted-foreground">질문을 불러오는 중...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">아직 질문이 없습니다.</p>
              <p className="text-sm text-muted-foreground">AI 상담을 통해 첫 번째 질문을 해보세요!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {roomTypeLabels[question.room_type] || question.room_type}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(question.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="질문 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{question.question}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="diary" className="space-y-4">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">메모리 다이어리</h2>
            <p className="text-muted-foreground mb-6">일상의 감정과 생각을 기록하고, AI가 패턴을 분석해드립니다.</p>
            <Button onClick={() => setShowMemoryDiary(true)} size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-5 w-5 mr-2" />
              다이어리 열기
            </Button>
          </div>

          {/* 최근 활동 미리보기 */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/20">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">일기 작성</h3>
                <p className="text-sm text-muted-foreground">오늘의 감정과 생각을 기록하세요</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20">
              <CardContent className="p-6 text-center">
                <Tag className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">패턴 분석</h3>
                <p className="text-sm text-muted-foreground">AI가 감정 패턴을 분석합니다</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200/20">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">인사이트</h3>
                <p className="text-sm text-muted-foreground">개인화된 조언을 받아보세요</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 메모리 다이어리 모달 */}
      <MemoryDiary userId={user?.id || null} isOpen={showMemoryDiary} onClose={() => setShowMemoryDiary(false)} />
    </div>
  )
}
