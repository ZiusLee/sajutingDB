"use client"

import { useState } from "react"
import { useSmartMemory } from "@/hooks/use-smart-memory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MemoryEditDialog } from "./memory-edit-dialog"
import { Brain, Search, Edit, Trash2, Pin, PinOff, BarChart3, Trash, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface SmartMemory {
  id: string
  user_id: string
  content: string
  type: string
  keywords: string
  importance: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

interface MemoryDashboardProps {
  userId: string
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const { memories, loading, error, fetchMemories, updateMemory, deleteMemory, deleteAllMemories, togglePin, refetch } =
    useSmartMemory(userId)

  const [searchQuery, setSearchQuery] = useState("")
  const [editingMemory, setEditingMemory] = useState<SmartMemory | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleSearch = () => {
    fetchMemories(searchQuery)
  }

  const handleEdit = (memory: SmartMemory) => {
    setEditingMemory(memory)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteMemory(id)
  }

  const handleTogglePin = async (memory: SmartMemory) => {
    await togglePin(memory.id, !memory.is_pinned)
  }

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      personal: "개인정보",
      preference: "선호도",
      context: "대화맥락",
      goal: "목표",
      relationship: "관계",
      other: "기타",
    }
    return typeLabels[type] || type
  }

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      personal: "bg-blue-100 text-blue-800",
      preference: "bg-green-100 text-green-800",
      context: "bg-yellow-100 text-yellow-800",
      goal: "bg-purple-100 text-purple-800",
      relationship: "bg-pink-100 text-pink-800",
      other: "bg-gray-100 text-gray-800",
    }
    return typeColors[type] || "bg-gray-100 text-gray-800"
  }

  // 통계 계산
  const stats = {
    total: memories.length,
    pinned: memories.filter((m) => m.is_pinned).length,
    byType: memories.reduce(
      (acc, memory) => {
        acc[memory.type] = (acc[memory.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    avgImportance:
      memories.length > 0
        ? Math.round((memories.reduce((sum, m) => sum + m.importance, 0) / memories.length) * 10) / 10
        : 0,
  }

  // 정렬된 메모리 (고정된 것 먼저, 그 다음 중요도 순)
  const sortedMemories = [...memories].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return b.importance - a.importance
  })

  if (loading && memories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>메모리를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI 메모리 대시보드
          </h1>
          <p className="text-gray-600">AI가 기억하고 있는 당신의 정보를 관리하세요</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      <Tabs defaultValue="memories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="memories">메모리 목록</TabsTrigger>
          <TabsTrigger value="search">검색</TabsTrigger>
          <TabsTrigger value="analytics">분석</TabsTrigger>
        </TabsList>

        <TabsContent value="memories" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 {stats.total}개의 메모리 ({stats.pinned}개 고정됨)
            </p>
            {memories.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-4 w-4 mr-2" />
                    전체 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>모든 메모리 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 모든 메모리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllMemories}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {memories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">아직 저장된 메모리가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-2">AI와 대화하면서 메모리가 자동으로 생성됩니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedMemories.map((memory) => (
                <Card key={memory.id} className={memory.is_pinned ? "border-yellow-200 bg-yellow-50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(memory.type)}>{getTypeLabel(memory.type)}</Badge>
                        <Badge variant="outline">중요도 {memory.importance}</Badge>
                        {memory.is_pinned && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Pin className="h-3 w-3 mr-1" />
                            고정됨
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleTogglePin(memory)}>
                          {memory.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(memory)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>메모리 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 메모리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(memory.id)}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{memory.content}</p>
                    {memory.keywords && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {memory.keywords.split(",").map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(memory.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="키워드로 메모리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>

          {searchQuery && (
            <p className="text-sm text-gray-600">
              "{searchQuery}" 검색 결과: {memories.length}개
            </p>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">총 메모리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">고정된 메모리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pinned}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">평균 중요도</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgImportance}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">메모리 타입</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.byType).length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                타입별 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{getTypeLabel(type)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MemoryEditDialog
        memory={editingMemory}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={updateMemory}
      />
    </div>
  )
}
