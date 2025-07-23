"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Search, Filter, Trash2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

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

interface MemoryDashboardProps {
  userId: string
}

const memoryTypeLabels: Record<string, string> = {
  identity: "신원정보",
  goal: "목표/계획",
  emotion: "감정상태",
  relationship: "인간관계",
  interest: "관심사",
  schedule: "일정",
  preference: "선호도",
  situation: "상황",
}

const getImportanceColor = (score: number) => {
  if (score >= 0.8) return "bg-red-100 text-red-800"
  if (score >= 0.6) return "bg-yellow-100 text-yellow-800"
  return "bg-green-100 text-green-800"
}

const getImportanceLabel = (score: number) => {
  if (score >= 0.8) return "높음"
  if (score >= 0.6) return "보통"
  return "낮음"
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadMemories()
  }, [userId])

  useEffect(() => {
    filterMemories()
  }, [memories, searchTerm, typeFilter])

  const loadMemories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/smart-memory?userId=${userId}`)

      if (response.ok) {
        const data = await response.json()
        setMemories(data.memories || [])
        setStats(data.stats || {})
      } else {
        toast({
          title: "메모리 로드 실패",
          description: "메모리를 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("메모리 로드 오류:", error)
      toast({
        title: "오류 발생",
        description: "메모리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterMemories = () => {
    let filtered = memories

    if (searchTerm) {
      filtered = filtered.filter((memory) => memory.content.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((memory) => memory.type === typeFilter)
    }

    // 중요도와 최근 참조 순으로 정렬
    filtered.sort((a, b) => {
      const importanceDiff = b.importance_score - a.importance_score
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff
      return new Date(b.last_referenced).getTime() - new Date(a.last_referenced).getTime()
    })

    setFilteredMemories(filtered)
  }

  const deleteMemory = async (memoryId: string) => {
    if (!confirm("이 메모리를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/api/smart-memory/${memoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "메모리 삭제됨",
          description: "메모리가 성공적으로 삭제되었습니다.",
        })
        loadMemories()
      } else {
        throw new Error("삭제 실패")
      }
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "메모리 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">총 메모리</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byType || {}).map(([type, count]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count as number}</div>
                <div className="text-sm text-muted-foreground">{memoryTypeLabels[type] || type}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>메모리 목록</span>
            <Button onClick={loadMemories} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="메모리 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                {Object.entries(memoryTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모리 목록 */}
          <div className="space-y-3">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {memories.length === 0 ? "저장된 메모리가 없습니다." : "검색 결과가 없습니다."}
              </div>
            ) : (
              filteredMemories.map((memory) => (
                <Card key={memory.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{memoryTypeLabels[memory.type] || memory.type}</Badge>
                          <Badge className={getImportanceColor(memory.importance_score)}>
                            {getImportanceLabel(memory.importance_score)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">참조 {memory.reference_count}회</span>
                        </div>
                        <p className="text-sm mb-2">{memory.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            생성:{" "}
                            {formatDistanceToNow(new Date(memory.first_mentioned), { addSuffix: true, locale: ko })}
                          </span>
                          <span>
                            최근 참조:{" "}
                            {formatDistanceToNow(new Date(memory.last_referenced), { addSuffix: true, locale: ko })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMemory(memory.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
