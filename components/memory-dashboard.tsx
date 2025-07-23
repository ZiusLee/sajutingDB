"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Database, Trash2, Edit, RefreshCw } from "lucide-react"
import { MemoryDebugPanel } from "./memory-debug-panel"
import { useToast } from "@/hooks/use-toast"

interface Memory {
  id: string
  type: string
  content: string
  importance_score: number
  reference_count: number
  first_mentioned: string
  last_referenced: string
  created_at: string
}

interface MemoryStats {
  total: number
  byType: Record<string, number>
}

interface MemoryDashboardProps {
  userId: string
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [stats, setStats] = useState<MemoryStats>({ total: 0, byType: {} })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  const typeNames: Record<string, string> = {
    identity: "신원정보",
    goal: "목표/계획",
    emotion: "감정상태",
    relationship: "인간관계",
    interest: "관심사",
    schedule: "일정",
    preference: "선호도",
    situation: "상황",
  }

  const typeColors: Record<string, string> = {
    identity: "bg-blue-100 text-blue-800",
    goal: "bg-green-100 text-green-800",
    emotion: "bg-purple-100 text-purple-800",
    relationship: "bg-pink-100 text-pink-800",
    interest: "bg-yellow-100 text-yellow-800",
    schedule: "bg-orange-100 text-orange-800",
    preference: "bg-indigo-100 text-indigo-800",
    situation: "bg-red-100 text-red-800",
  }

  const loadMemories = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/smart-memory?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMemories(data.memories || [])
        setStats(data.stats || { total: 0, byType: {} })
      } else {
        throw new Error("Failed to load memories")
      }
    } catch (error) {
      console.error("Error loading memories:", error)
      toast({
        title: "메모리 로드 실패",
        description: "메모리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/smart-memory/${memoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId))
        toast({
          title: "메모리 삭제됨",
          description: "선택한 메모리가 삭제되었습니다.",
        })
      } else {
        throw new Error("Failed to delete memory")
      }
    } catch (error) {
      console.error("Error deleting memory:", error)
      toast({
        title: "삭제 실패",
        description: "메모리 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (userId) {
      loadMemories()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 메모리</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">저장된 기억들</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 카테고리</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
            <p className="text-xs text-muted-foreground">다양한 정보 유형</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 업데이트</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memories.length > 0
                ? new Date(Math.max(...memories.map((m) => new Date(m.last_referenced).getTime()))).toLocaleDateString()
                : "없음"}
            </div>
            <p className="text-xs text-muted-foreground">마지막 참조</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="memories">메모리 목록</TabsTrigger>
          <TabsTrigger value="debug">디버그</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 카테고리별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 메모리</CardTitle>
              <CardDescription>각 정보 유형별로 저장된 메모리 수를 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="text-center">
                    <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>{typeNames[type] || type}</Badge>
                    <div className="text-2xl font-bold mt-2">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 최근 메모리 */}
          <Card>
            <CardHeader>
              <CardTitle>최근 메모리</CardTitle>
              <CardDescription>가장 최근에 참조된 메모리들입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memories
                  .sort((a, b) => new Date(b.last_referenced).getTime() - new Date(a.last_referenced).getTime())
                  .slice(0, 5)
                  .map((memory) => (
                    <div key={memory.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={typeColors[memory.type] || "bg-gray-100 text-gray-800"}>
                            {typeNames[memory.type] || memory.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            중요도: {Math.round(memory.importance_score * 100)}%
                          </span>
                        </div>
                        <p className="text-sm">{memory.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {memory.reference_count}회 참조 • 마지막: {new Date(memory.last_referenced).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">전체 메모리 ({memories.length})</h3>
            <Button onClick={loadMemories} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          <div className="space-y-3">
            {memories.map((memory) => (
              <Card key={memory.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeColors[memory.type] || "bg-gray-100 text-gray-800"}>
                          {typeNames[memory.type] || memory.type}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          중요도: {Math.round(memory.importance_score * 100)}%
                        </span>
                        <span className="text-sm text-gray-500">{memory.reference_count}회 참조</span>
                      </div>
                      <p className="text-sm mb-2">{memory.content}</p>
                      <div className="text-xs text-gray-500">
                        <span>생성: {new Date(memory.first_mentioned).toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span>마지막 참조: {new Date(memory.last_referenced).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMemory(memory.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {memories.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 저장된 메모리가 없습니다</h3>
                <p className="text-gray-500">AI와 대화를 나누면 자동으로 중요한 정보가 기억됩니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="debug">
          <MemoryDebugPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
