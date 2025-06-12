"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, BookOpen, Plus, Brain, TrendingUp, Filter, Tag, Clock, Lightbulb } from "lucide-react"
import { enhancedMemoryService, type MemoryEntry, type MemoryInsight } from "@/lib/memory-service-enhanced"

interface MemoryDiaryProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function MemoryDiary({ userId, isOpen, onClose }: MemoryDiaryProps) {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [insights, setInsights] = useState<MemoryInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    emotionalState: {} as Record<string, any>,
    tags: [] as string[],
    category: "",
  })

  // Load entries and insights
  const loadData = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const [entriesData, insightsData] = await Promise.all([
        enhancedMemoryService.getMemoryEntries(userId, {
          search: searchQuery || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          limit: 50,
        }),
        enhancedMemoryService.generateInsights(userId),
      ])

      setEntries(entriesData)
      setInsights(insightsData)
    } catch (error) {
      console.error("Error loading memory data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      loadData()
    }
  }, [isOpen, userId, searchQuery, selectedTags])

  // Create new entry
  const handleCreateEntry = async () => {
    if (!userId || !newEntry.content.trim()) return

    try {
      const entry = await enhancedMemoryService.createMemoryEntry({
        userId,
        title: newEntry.title || undefined,
        content: newEntry.content,
        emotionalState: newEntry.emotionalState,
        tags: newEntry.tags,
        category: newEntry.category || undefined,
        entryType: "manual",
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
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr)
    const formatted = date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })

    if (timeStr) {
      const time = timeStr.substring(0, 5) // HH:MM
      return `${formatted} ${time}`
    }

    return formatted
  }

  // Get emotion color
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

  if (!userId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <span>메모리 다이어리</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-400">로그인이 필요한 기능입니다.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-auto max-h-[90vh] overflow-hidden bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <span>메모리 다이어리</span>
              <Badge variant="secondary" className="ml-2">
                {entries.length}개 기록
              </Badge>
            </div>
            <Button onClick={() => setShowNewEntryForm(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-1" />새 기록
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[75vh]">
          <Tabs defaultValue="entries" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="entries" className="text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                일기
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-sm">
                <Lightbulb className="h-4 w-4 mr-1" />
                인사이트
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                분석
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entries" className="space-y-4 mt-4">
              {/* Search and Filter */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="기록 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* New Entry Form */}
              {showNewEntryForm && (
                <Card className="bg-gray-700/50 border-gray-600">
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
                        className="bg-gray-600 border-gray-500"
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
                        className="bg-gray-600 border-gray-500"
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

              {/* Entries List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
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
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">아직 작성된 기록이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">첫 번째 일기를 작성해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="bg-gray-700/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            {entry.title && <h3 className="font-semibold text-white mb-1">{entry.title}</h3>}
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
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
                              <Badge
                                key={emotion}
                                variant="secondary"
                                className={`text-xs ${getEmotionColor(emotion)}`}
                              >
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <p className="text-gray-200 mb-3 leading-relaxed">{entry.content}</p>

                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs text-gray-300 border-gray-500">
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

            <TabsContent value="insights" className="space-y-4 mt-4">
              {insights.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">아직 생성된 인사이트가 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">더 많은 기록을 작성하면 패턴을 분석해드릴게요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className="bg-gray-700/50 border-gray-600">
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
                        <p className="text-gray-200 mb-3">{insight.description}</p>
                        <div className="text-sm text-gray-400">
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

            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">분석 기능을 준비 중입니다.</p>
                <p className="text-sm text-gray-500 mt-2">감정 변화 그래프와 패턴 분석을 곧 제공할 예정입니다!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
