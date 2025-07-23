"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Trash2, Edit, Search, Filter, Calendar, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Memory {
  id: string
  content: string
  type: string
  importance_score: number
  created_at: string
  updated_at: string
  metadata?: any
}

interface MemoryDashboardProps {
  userId: string
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadMemories()
  }, [userId])

  const loadMemories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/smart-memory?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMemories(data.memories || [])
      } else {
        console.error("Failed to load memories")
      }
    } catch (error) {
      console.error("Error loading memories:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/smart-memory`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memoryId }),
      })

      if (response.ok) {
        setMemories(memories.filter((m) => m.id !== memoryId))
        toast({
          title: "메모리 삭제됨",
          description: "선택한 메모리가 삭제되었습니다.",
        })
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

  const updateMemory = async (memoryId: string, content: string, type: string) => {
    try {
      const response = await fetch(`/api/smart-memory`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memoryId, content, type }),
      })

      if (response.ok) {
        await loadMemories()
        setIsEditDialogOpen(false)
        setSelectedMemory(null)
        toast({
          title: "메모리 업데이트됨",
          description: "메모리가 성공적으로 업데이트되었습니다.",
        })
      }
    } catch (error) {
      console.error("Error updating memory:", error)
      toast({
        title: "업데이트 실패",
        description: "메모리 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = memory.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || memory.type === filterType
    return matchesSearch && matchesType
  })

  const memoryTypes = [...new Set(memories.map((m) => m.type))]

  const getImportanceColor = (score: number) => {
    if (score >= 0.8) return "bg-red-100 text-red-800"
    if (score >= 0.6) return "bg-orange-100 text-orange-800"
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const getImportanceLabel = (score: number) => {
    if (score >= 0.8) return "매우 중요"
    if (score >= 0.6) return "중요"
    if (score >= 0.4) return "보통"
    return "낮음"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Brain className="h-8 w-8 animate-spin" />
              <span className="ml-2">메모리를 불러오는 중...</span>
            </div>
          </CardContent>
        </Card>
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
            <div className="text-2xl font-bold">{memories.length}</div>
            <p className="text-xs text-muted-foreground">저장된 기억들</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">중요한 메모리</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memories.filter((m) => m.importance_score >= 0.6).length}</div>
            <p className="text-xs text-muted-foreground">중요도 높음</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">메모리 타입</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryTypes.length}</div>
            <p className="text-xs text-muted-foreground">다양한 카테고리</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>메모리 검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="메모리 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 타입</SelectItem>
                {memoryTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 메모리 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>저장된 메모리 ({filteredMemories.length})</CardTitle>
          <CardDescription>AI가 기억하고 있는 당신에 대한 정보들입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMemories.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== "all"
                  ? "검색 조건에 맞는 메모리가 없습니다."
                  : "아직 저장된 메모리가 없습니다."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredMemories.map((memory) => (
                  <Card key={memory.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{memory.type}</Badge>
                            <Badge className={getImportanceColor(memory.importance_score)} variant="secondary">
                              {getImportanceLabel(memory.importance_score)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{memory.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(memory.created_at).toLocaleDateString("ko-KR")}
                            </span>
                            <span>중요도: {(memory.importance_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMemory(memory)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMemory(memory.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>메모리 편집</DialogTitle>
            <DialogDescription>메모리 내용과 타입을 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          {selectedMemory && (
            <EditMemoryForm
              memory={selectedMemory}
              onSave={(content, type) => updateMemory(selectedMemory.id, content, type)}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedMemory(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface EditMemoryFormProps {
  memory: Memory
  onSave: (content: string, type: string) => void
  onCancel: () => void
}

function EditMemoryForm({ memory, onSave, onCancel }: EditMemoryFormProps) {
  const [content, setContent] = useState(memory.content)
  const [type, setType] = useState(memory.type)

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim(), type)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메모리 내용을 입력하세요..."
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">타입</Label>
        <Input
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="메모리 타입을 입력하세요..."
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </div>
  )
}
