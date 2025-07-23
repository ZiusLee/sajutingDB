"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, Trash2, RefreshCw, User, Target, Heart, Users, Star, Calendar, Settings, Lightbulb } from "lucide-react"
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

const memoryTypeIcons: Record<string, any> = {
  identity: User,
  goal: Target,
  emotion: Heart,
  relationship: Users,
  interest: Star,
  schedule: Calendar,
  preference: Settings,
  situation: Lightbulb,
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
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadMemories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/smart-memory?userId=${userId}&query=all`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        // 실제 메모리 데이터는 별도 API에서 가져와야 함
        await loadMemoryList()
      } else {
        throw new Error(data.error || "Failed to load memories")
      }
    } catch (err) {
      console.error("Failed to load memories:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const loadMemoryList = async () => {
    try {
      // 실제 메모리 목록을 가져오는 API 호출
      // 현재는 mock 데이터 사용
      const mockMemories: Memory[] = [
        {
          id: "1",
          type: "identity",
          content: "프론트엔드 개발자로 일하고 있음",
          importance_score: 0.9,
          reference_count: 5,
          first_mentioned: "2024-01-15T10:00:00Z",
          last_referenced: "2024-01-20T15:30:00Z",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          type: "goal",
          content: "풀스택 개발자가 되고 싶어함",
          importance_score: 0.8,
          reference_count: 3,
          first_mentioned: "2024-01-16T14:00:00Z",
          last_referenced: "2024-01-19T09:15:00Z",
          created_at: "2024-01-16T14:00:00Z",
        },
        {
          id: "3",
          type: "interest",
          content: "React와 Next.js에 관심이 많음",
          importance_score: 0.7,
          reference_count: 8,
          first_mentioned: "2024-01-17T11:30:00Z",
          last_referenced: "2024-01-21T16:45:00Z",
          created_at: "2024-01-17T11:30:00Z",
        },
      ]
      setMemories(mockMemories)
    } catch (err) {
      console.error("Failed to load memory list:", err)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      // 메모리 삭제 API 호출
      toast({
        title: "메모리 삭제됨",
        description: "선택한 메모리가 삭제되었습니다.",
      })

      // 목록에서 제거
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))

      // 통계 업데이트
      await loadMemories()
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: "메모리 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadMemories()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          메모리를 불러오는 중 오류가 발생했습니다: {error}
          <Button variant="outline" size="sm" onClick={loadMemories} className="ml-2 bg-transparent">
            다시 시도
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 메모리</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {Object.entries(stats.byType)
          .slice(0, 3)
          .map(([type, count]) => {
            const Icon = memoryTypeIcons[type] || Brain
            return (
              <Card key={type}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{memoryTypeNames[type] || type}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Icon className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* 메모리 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                저장된 메모리
              </CardTitle>
              <CardDescription>AI가 기억하고 있는 당신에 대한 정보입니다.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMemories}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 저장된 메모리가 없습니다.</p>
              <p className="text-sm">AI와 대화를 나누면 중요한 정보가 자동으로 기억됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((memory) => {
                const Icon = memoryTypeIcons[memory.type] || Brain
                return (
                  <div
                    key={memory.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{memoryTypeNames[memory.type] || memory.type}</Badge>
                          <Badge variant="outline">중요도: {Math.round(memory.importance_score * 100)}%</Badge>
                          <Badge variant="outline">참조: {memory.reference_count}회</Badge>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{memory.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>첫 언급: {new Date(memory.first_mentioned).toLocaleDateString()}</span>
                          <span>마지막 참조: {new Date(memory.last_referenced).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMemory(memory.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
