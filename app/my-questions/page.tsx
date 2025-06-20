"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Brain, Clock, Tag, Lightbulb, Heart, Map, LogIn, Shield } from "lucide-react"
import { enhancedMemoryService, type MemoryEntry, type MemoryInsight } from "@/lib/memory-service-enhanced"

export default function PersonalSpacePage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [insights, setInsights] = useState<MemoryInsight[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    emotionalState: {} as Record<string, any>,
    tags: [] as string[],
    category: "",
  })

  const supabase = createClientComponentClient()
  const router = useRouter()

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
          router.push("/login?redirect=/my-questions")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("인증 확인 중 오류:", error)
        router.push("/login?redirect=/my-questions")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        router.push("/login?redirect=/my-questions")
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // 데이터 로드 (인증된 사용자만)
  const loadData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const [entriesData, insightsData, analyticsData] = await Promise.all([
        enhancedMemoryService.getMemoryEntries(user.id, {
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
          limit: 50,
        }),
        enhancedMemoryService.generateInsights(user.id),
        fetch(`/api/memory/analytics?days=30`)
          .then((res) => res.json())
          .catch(() => null),
      ])

      setEntries(entriesData)
      setInsights(insightsData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error loading memory data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id, searchQuery, selectedCategory])

  // 새 엔트리 생성
  const handleCreateEntry = async () => {
    if (!user?.id || !newEntry.content.trim()) return

    try {
      const entry = await enhancedMemoryService.createMemoryEntry({
        userId: user.id, // auth.users.id 사용
        title: newEntry.title || undefined,
        content: newEntry.content,
        emotionalState: newEntry.emotionalState,
        tags: newEntry.tags,
        category: newEntry.category || undefined,
        entryType: "manual",
        isPrivate: true,
        visibility: "private",
      })

      if (entry) {
        setEntries((prev) => [entry, ...prev])
        setNewEntry({
          title: "",
          content: "",
          emotionalState: {},
          tags: [],
          category: "",
        })
        setShowNewEntryForm(false)
        loadData()
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr)
    const formatted = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })

    if (timeStr) {
      const time = timeStr.substring(0, 5)
      return `${formatted} ${time}`
    }

    return formatted
  }

  // 감정 색상
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happiness: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      anxiety: "bg-red-500/20 text-red-300 border-red-500/30",
      sadness: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      anger: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      stress: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      calm: "bg-green-500/20 text-green-300 border-green-500/30",
    }
    return colors[emotion] || "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-6">
            메모리 다이어리는 개인적인 기록을 안전하게 보관하기 위해 로그인이 필요합니다.
          </p>
          <Button
            onClick={() => router.push("/login?redirect=/my-questions")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            로그인하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* 보안 알림 */}
      <Alert className="mb-6 border-purple-200/20 bg-purple-50/50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>개인 정보 보호:</strong> 모든 메모리 기록은 암호화되어 안전하게 보관되며, 오직 본인만 접근할 수
          있습니다.
        </AlertDescription>
      </Alert>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">개인 공간</h1>
          <p className="text-muted-foreground">당신의 감정과 생각을 기록하고, AI가 패턴을 분석해드립니다</p>
        </div>
        <Button onClick={() => setShowNewEntryForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />새 기록 작성
        </Button>
      </div>

      {/* 빠른 통계 */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{analytics.analytics?.totalEntries || 0}</div>
              <div className="text-sm text-muted-foreground">총 기록</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{analytics.analytics?.streakDays || 0}</div>
              <div className="text-sm text-muted-foreground">연속 기록</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{insights.length}</div>
              <div className="text-sm text-muted-foreground">AI 인사이트</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-200/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.round((analytics.analytics?.avgEntriesPerDay || 0) * 10) / 10}
              </div>
              <div className="text-sm text-muted-foreground">일평균 기록</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="diary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="diary" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>메모리 다이어리</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>AI 인사이트</span>
          </TabsTrigger>
          <TabsTrigger value="mood" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>감정 대시보드</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>라이프 맵핑</span>
          </TabsTrigger>
        </TabsList>

        {/* 메모리 다이어리 탭 */}
        <TabsContent value="diary" className="space-y-6">
          {/* 검색 및 필터 */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="기록 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">모든 카테고리</option>
              <option value="relationship">연애/관계</option>
              <option value="career">직장/업무</option>
              <option value="family">가족</option>
              <option value="health">건강</option>
              <option value="money">재정</option>
              <option value="personal">개인적</option>
            </select>
          </div>

          {/* 새 기록 작성 폼 */}
          {showNewEntryForm && (
            <Card className="border-purple-200/20">
              <CardHeader>
                <CardTitle className="text-lg">새로운 기록 작성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">제목 (선택사항)</Label>
                  <Input
                    id="title"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="오늘의 제목..."
                  />
                </div>

                <div>
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    value={newEntry.content}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="오늘 있었던 일이나 느낀 점을 자유롭게 적어보세요..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>오늘의 기분</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["happiness", "anxiety", "sadness", "anger", "stress", "calm"].map((emotion) => (
                      <Button
                        key={emotion}
                        variant={newEntry.emotionalState[emotion] ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setNewEntry((prev) => ({
                            ...prev,
                            emotionalState: {
                              ...prev.emotionalState,
                              [emotion]: !prev.emotionalState[emotion],
                            },
                          }))
                        }
                        className="text-xs"
                      >
                        {emotion === "happiness" && "😊"}
                        {emotion === "anxiety" && "😰"}
                        {emotion === "sadness" && "😢"}
                        {emotion === "anger" && "😠"}
                        {emotion === "stress" && "😵"}
                        {emotion === "calm" && "😌"}
                        {emotion}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCreateEntry} className="bg-purple-600 hover:bg-purple-700">
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewEntryForm(false)}>
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 기록 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">아직 작성된 기록이 없습니다.</p>
              <p className="text-sm text-muted-foreground">첫 번째 일기를 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        {entry.title && <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(entry.entryDate, entry.entryTime)}</span>
                          {entry.category && (
                            <Badge variant="secondary" className="text-xs">
                              {entry.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Object.keys(entry.emotionalState).map((emotion) => (
                          <Badge key={emotion} variant="secondary" className={`text-xs ${getEmotionColor(emotion)}`}>
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <p className="text-foreground mb-3 leading-relaxed">{entry.content}</p>

                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI 인사이트 탭 */}
        <TabsContent value="insights" className="space-y-6">
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">아직 생성된 인사이트가 없습니다.</p>
              <p className="text-sm text-muted-foreground">더 많은 기록을 작성하면 패턴을 분석해드릴게요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-blue-200/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        <span>{insight.title}</span>
                      </CardTitle>
                      <Badge variant="secondary">신뢰도 {Math.round(insight.confidenceScore * 100)}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground mb-3">{insight.description}</p>
                    <div className="text-sm text-muted-foreground">
                      <span>
                        분석 기간: {insight.dateRangeStart} ~ {insight.dateRangeEnd}
                      </span>
                      <span className="ml-4">기반 기록: {insight.sourceMemoryIds.length}개</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 감정 대시보드 탭 */}
        <TabsContent value="mood" className="space-y-6">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-pink-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">감정 대시보드</h2>
            <p className="text-muted-foreground mb-6">감정 변화와 패턴을 시각적으로 분석합니다.</p>
            <Badge variant="secondary" className="text-sm">
              곧 출시 예정
            </Badge>
          </div>
        </TabsContent>

        {/* 라이프 맵핑 탭 */}
        <TabsContent value="mapping" className="space-y-6">
          <div className="text-center py-12">
            <Map className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">라이프 맵핑</h2>
            <p className="text-muted-foreground mb-6">인생의 중요한 순간들과 패턴을 지도로 시각화합니다.</p>
            <Badge variant="secondary" className="text-sm">
              곧 출시 예정
            </Badge>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
