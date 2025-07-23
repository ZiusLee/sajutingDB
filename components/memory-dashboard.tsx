"use client"

import { useState } from "react"
import { useSmartMemory } from "@/hooks/use-smart-memory"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Brain, Search, Trash2, RefreshCw, X } from "lucide-react"
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
  const { memories, loading, error, fetchMemories, deleteMemory, deleteAllMemories, refetch } = useSmartMemory(userId)

  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    fetchMemories(searchQuery)
  }

  const handleDelete = async (id: string) => {
    await deleteMemory(id)
  }

  const clearSearch = () => {
    setSearchQuery("")
    refetch()
  }

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            저장된 메모리
          </h1>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        <p className="text-gray-600 text-sm">
          사주핑이 당신과의 대화에서 기억하고 있는 정보들입니다. 시간이 지나면서 일부 정보는 잊혀질 수 있지만, 저장된
          메모리는 영구적으로 보관됩니다.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="메모리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={!searchQuery}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>

      {/* Memory List */}
      <div className="space-y-4">
        {memories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">
                {searchQuery ? "검색 결과가 없습니다." : "아직 저장된 메모리가 없습니다."}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery ? "다른 키워드로 검색해보세요." : "사주핑과 대화하면서 메모리가 자동으로 생성됩니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Memory Items */}
            <div className="space-y-3">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors relative"
                >
                  <div className="pr-10">
                    <p className="text-sm leading-relaxed">{memory.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(memory.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      {memory.importance > 7 && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 font-medium">중요</span>
                        </>
                      )}
                      {memory.is_pinned && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-medium">고정됨</span>
                        </>
                      )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
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
              ))}
            </div>

            {/* Delete All Button */}
            {memories.length > 0 && (
              <div className="flex justify-center pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                    >
                      모든 메모리 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>모든 메모리 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말로 모든 메모리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 사주핑이 당신에 대해 기억하고
                        있던 모든 정보가 사라집니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAllMemories} className="bg-red-600 hover:bg-red-700">
                        모두 삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && memories.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          "{searchQuery}" 검색 결과 {memories.length}개
        </div>
      )}
    </div>
  )
}
