"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemoryDebugPanel } from "./memory-debug-panel"
import { Brain, Trash2, RefreshCw, User, Target, Heart, Users, Star, Calendar, Settings, MapPin } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Memory {
  id: string
  type: string
  content: string
  importance_score: number
  reference_count: number
  first_mentioned: string
  last_referenced: string
  created_at: string
  updated_at: string
}

interface MemoryStats {
  total: number
  byType: Record<string, number>
}

interface MemoryDashboardProps {
  userId: string
}

const memoryTypeIcons: Record<string, any> = {
  identity: User,
  goal: Target,
  emotion: Heart,
  relationship: Users,
  interest: Star,
  schedule: Calendar,
  preference: Settings,
  situation: MapPin,
}

const memoryTypeNames: Record<string, string> = {
  identity: "신원정보",
  goal: "목표/계획",
  emotion: "감정상태",
  relationship: "인간관계",
  interest: "관심사",
  schedule: "일정",
  preference: "선호도",
  situation: "상황",
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [stats, setStats] = useState<MemoryStats>({ total: 0, byType: {} })
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")

  const loadMemories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/smart-memory?userId=${userId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setMemories(data.memories || [])
      setStats(data.stats || { total: 0, byType: {} })
    } catch (error) {
      console.error("메모리 로드 실패:", error)
      toast({
        title: "메모리 로드 실패",
        description: "메모리를 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch("/api/smart-memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      await loadMemories()
      toast({
        title: "메모리 삭제 완료",
        description: "선택한 메모리가 삭제되었습니다.",
      })
    } catch (error) {
      console.error("메모리 삭제 실패:", error)
      toast({
        title: "메모리 삭제 실패",
        description: "메모리 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (userId) {
      loadMemories()
    }
  }, [userId])

  const filteredMemories = selectedType === "all" ? memories : memories.filter((memory) => memory.type === selectedType)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getImportanceColor = (score: number) => {
    if (score >= 0.8) return "bg-red-500"
    if (score >= 0.6) return "bg-orange-500"
    if (score >= 0.4) return "bg-yellow-500"
    return "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 메모리</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        {Object.entries(stats.byType)
          .slice(0, 3)
          .map(([type, count]) => {
            const Icon = memoryTypeIcons[type] || Brain
            return (
              <Card key={type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{memoryTypeNames[type] || type}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      <Tabs defaultValue="memories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memories">메모리 목록</TabsTrigger>
          <TabsTrigger value="debug">디버그 패널</TabsTrigger>
        </TabsList>

        <TabsContent value="memories" className="space-y-4">
          {/* 필터 및 새로고침 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                전체 ({stats.total})
              </Button>
              {Object.entries(stats.byType).map(([type, count]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {memoryTypeNames[type] || type} ({count})
                </Button>
              ))}
            </div>
            <Button onClick={loadMemories} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>

          {/* 메모리 목록 */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">메모리를 불러오는 중...</div>
                </CardContent>
              </Card>
            ) : filteredMemories.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    {selectedType === "all"
                      ? "저장된 메모리가 없습니다."
                      : `${memoryTypeNames[selectedType]} 메모리가 없습니다.`}
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredMemories.map((memory) => {
                const Icon = memoryTypeIcons[memory.type] || Brain
                return (
                  <Card key={memory.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <Badge variant="secondary">{memoryTypeNames[memory.type] || memory.type}</Badge>
                            <div className={`w-2 h-2 rounded-full ${getImportanceColor(memory.importance_score)}`} />
                            <span className="text-xs text-muted-foreground">
                              중요도: {(memory.importance_score * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs text-muted-foreground">참조: {memory.reference_count}회</span>
                          </div>
                          <p className="text-sm mb-2">{memory.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>생성: {formatDate(memory.first_mentioned)}</span>
                            <span>최근 참조: {formatDate(memory.last_referenced)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button variant="ghost" size="sm" onClick={() => deleteMemory(memory.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="debug">
          <MemoryDebugPanel userId={userId} onMemoryUpdate={loadMemories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
