"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, Trash2, Pin, PinOff, RefreshCw } from "lucide-react"
import { MemoryEditDialog } from "./memory-edit-dialog"

interface Memory {
  id: string
  type: string
  content: string
  importance_score: number
  reference_count: number
  is_pinned: boolean
  first_mentioned: string
  last_referenced: string
  created_at: string
  updated_at: string
}

interface MemoryStats {
  total: number
  byType: Record<string, number>
}

export function MemoryDashboard({ userId }: { userId: string }) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [stats, setStats] = useState<MemoryStats>({ total: 0, byType: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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
    try {
      setLoading(true)
      setError(null)

      // 메모리 목록 조회
      const memoriesResponse = await fetch(`/api/smart-memory?userId=${userId}`)
      if (!memoriesResponse.ok) {
        throw new Error("메모리 조회 실패")
      }
      const memoriesData = await memoriesResponse.json()
      setMemories(memoriesData.memories || [])

      // 통계 조회
      const statsResponse = await fetch(`/api/smart-memory/stats?userId=${userId}`)
      if (!statsResponse.ok) {
        throw new Error("통계 조회 실패")
      }
      const statsData = await statsResponse.json()
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류")
    } finally {
      setLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/smart-memory/${memoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("메모리 삭제 실패")
      }

      await loadMemories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패")
    }
  }

  const togglePin = async (memoryId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/smart-memory/${memoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_pinned: !isPinned,
        }),
      })

      if (!response.ok) {
        throw new Error("핀 설정 실패")
      }

      await loadMemories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "핀 설정 실패")
    }
  }

  useEffect(() => {
    loadMemories()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          메모리를 불러오는 중...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const groupedMemories = memories.reduce(
    (acc, memory) => {
      if (!acc[memory.type]) {
        acc[memory.type] = []
      }
      acc[memory.type].push(memory)
      return acc
    },
    {} as Record<string, Memory[]>,
  )

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">총 메모리</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(stats.byType)
          .slice(0, 3)
          .map(([type, count]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{typeNames[type] || type}</p>
                  <p className="text-2xl font-bold">{count}</p>
                  <Progress value={(count / stats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* 메모리 목록 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>저장된 메모리</CardTitle>
          <Button onClick={loadMemories} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </CardHeader>
        <CardContent>
          {memories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 저장된 메모리가 없습니다.</p>
              <p className="text-sm">AI와 대화하면 자동으로 메모리가 생성됩니다.</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">전체 ({stats.total})</TabsTrigger>
                {Object.entries(stats.byType)
                  .slice(0, 4)
                  .map(([type, count]) => (
                    <TabsTrigger key={type} value={type}>
                      {typeNames[type]} ({count})
                    </TabsTrigger>
                  ))}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {memories
                  .sort((a, b) => {
                    if (a.is_pinned !== b.is_pinned) {
                      return a.is_pinned ? -1 : 1
                    }
                    return b.importance_score - a.importance_score
                  })
                  .map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      typeNames={typeNames}
                      typeColors={typeColors}
                      onEdit={() => {
                        setSelectedMemory(memory)
                        setEditDialogOpen(true)
                      }}
                      onDelete={() => deleteMemory(memory.id)}
                      onTogglePin={() => togglePin(memory.id, memory.is_pinned)}
                    />
                  ))}
              </TabsContent>

              {Object.entries(groupedMemories).map(([type, typeMemories]) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {typeMemories
                    .sort((a, b) => {
                      if (a.is_pinned !== b.is_pinned) {
                        return a.is_pinned ? -1 : 1
                      }
                      return b.importance_score - a.importance_score
                    })
                    .map((memory) => (
                      <MemoryCard
                        key={memory.id}
                        memory={memory}
                        typeNames={typeNames}
                        typeColors={typeColors}
                        onEdit={() => {
                          setSelectedMemory(memory)
                          setEditDialogOpen(true)
                        }}
                        onDelete={() => deleteMemory(memory.id)}
                        onTogglePin={() => togglePin(memory.id, memory.is_pinned)}
                      />
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      {selectedMemory && (
        <MemoryEditDialog
          memory={selectedMemory}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={loadMemories}
        />
      )}
    </div>
  )
}

function MemoryCard({
  memory,
  typeNames,
  typeColors,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  memory: Memory
  typeNames: Record<string, string>
  typeColors: Record<string, string>
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
}) {
  return (
    <Card className={`${memory.is_pinned ? "ring-2 ring-yellow-400" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={typeColors[memory.type] || "bg-gray-100 text-gray-800"}>
                {typeNames[memory.type] || memory.type}
              </Badge>
              <Badge variant="outline">중요도: {Math.round(memory.importance_score * 100)}%</Badge>
              <Badge variant="outline">참조: {memory.reference_count}회</Badge>
              {memory.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
            </div>
            <p className="text-sm text-gray-900">{memory.content}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>생성: {new Date(memory.created_at).toLocaleDateString()}</span>
              <span>최근 참조: {new Date(memory.last_referenced).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="sm" onClick={onTogglePin}>
              {memory.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              편집
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
