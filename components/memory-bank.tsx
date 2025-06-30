"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Trash2,
  Users,
  Briefcase,
  MapPin,
  Heart,
  User,
  RefreshCw,
  MessageSquare,
  Settings2,
  Zap,
  Archive,
} from "lucide-react"
import { getMemories, deleteMemory } from "@/lib/memory-api-service"
import type { MemoryEntry, MemoryType } from "@/lib/memory-types"

interface MemoryBankProps {
  userId: string | null
  sessionId?: string | null
  isOpen: boolean
  onClose: () => void
}

export default function MemoryBank({ userId, sessionId, isOpen, onClose }: MemoryBankProps) {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 메모리 로드
  const loadMemories = async () => {
    if (!userId && !sessionId) {
      console.log("Memory Bank: User ID and Session ID are missing.")
      setMemories([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log("Loading memories for:", { userId, sessionId })
      const fetchedMemories = await getMemories(userId, sessionId)
      setMemories(fetchedMemories || [])
      console.log(`메모리 뱅크 로드: ${fetchedMemories?.length || 0}개 항목`)
    } catch (error) {
      console.error("Error loading memories:", error)
      setMemories([])
      setError("메모리를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 메모리 로드
  useEffect(() => {
    if (isOpen && (userId || sessionId)) {
      loadMemories()
    }
  }, [isOpen, userId, sessionId])

  // 메모리 삭제
  const handleDeleteMemory = async (memoryId: string) => {
    if (!userId) {
      // Deletion currently requires userId
      console.warn("User ID is required to delete memory.")
      // Optionally, show a toast or message to the user
      return
    }
    try {
      await deleteMemory(memoryId, userId) // Use new service
      setMemories((prev) => prev.filter((memory) => memory.id !== memoryId))
    } catch (error) {
      console.error("Error deleting memory:", error)
      // Optionally, show a toast or message to the user
    }
  }

  // 타입별 아이콘
  const getTypeIcon = (type: MemoryType) => {
    switch (type) {
      case "conversation":
        return <MessageSquare className="h-4 w-4" /> // Example icon
      case "preference":
        return <Settings2 className="h-4 w-4" /> // Example icon
      case "insight":
        return <Zap className="h-4 w-4" /> // Example icon
      case "context":
        return <Archive className="h-4 w-4" /> // Example icon
      case "compatibility":
        return <Users className="h-4 w-4" />
      case "career":
        return <Briefcase className="h-4 w-4" />
      case "location":
        return <MapPin className="h-4 w-4" />
      case "emotion":
        return <Heart className="h-4 w-4" />
      case "personal":
        return <User className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  // 타입별 색상
  const getTypeColor = (type: MemoryType) => {
    switch (type) {
      case "conversation":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30"
      case "preference":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "insight":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30"
      case "context":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
      case "compatibility":
        return "bg-pink-500/20 text-pink-300 border-pink-500/30"
      case "career":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "location":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "emotion":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "personal":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  // 타입별 메모리 필터링
  const getMemoriesByType = (type: MemoryType) => {
    return memories.filter((memory) => memory.type === type)
  }

  // 날짜 포맷팅
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!userId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span>메모리 뱅크</span>
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
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-hidden bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span>메모리 뱅크</span>
              <Badge variant="secondary" className="ml-2">
                {memories.length}개
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMemories}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
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
          ) : error ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={loadMemories} className="mt-2">
                다시 시도
              </Button>
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">아직 저장된 메모리가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">대화를 나누면 자동으로 중요한 정보가 저장됩니다.</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-700">
                <TabsTrigger value="all" className="text-xs">
                  전체
                </TabsTrigger>
                <TabsTrigger value="conversation" className="text-xs">
                  대화
                </TabsTrigger>
                <TabsTrigger value="preference" className="text-xs">
                  선호도
                </TabsTrigger>
                <TabsTrigger value="insight" className="text-xs">
                  인사이트
                </TabsTrigger>
                <TabsTrigger value="context" className="text-xs">
                  컨텍스트
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {memories.map((memory) => (
                  <Card key={memory.id} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(memory.type)}
                            <Badge variant="secondary" className={getTypeColor(memory.type)}>
                              {memory.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatDate(memory.timestamp)}</span>
                          </div>
                          <p className="text-white text-sm whitespace-pre-wrap">
                            {typeof memory.content === "string"
                              ? memory.content
                              : JSON.stringify(memory.content, null, 2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {(["conversation", "preference", "insight", "context"] as const).map((type) => (
                <TabsContent key={type} value={type} className="space-y-3 mt-4">
                  {getMemoriesByType(type).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-600 mb-2">{getTypeIcon(type)}</div>
                      <p className="text-gray-400 text-sm">이 카테고리에 저장된 메모리가 없습니다.</p>
                    </div>
                  ) : (
                    getMemoriesByType(type).map((memory) => (
                      <Card key={memory.id} className="bg-gray-700/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {getTypeIcon(memory.type)}
                                <Badge variant="secondary" className={getTypeColor(memory.type)}>
                                  {memory.type}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatDate(memory.timestamp)}</span>
                              </div>
                              <p className="text-white text-sm whitespace-pre-wrap">
                                {typeof memory.content === "string"
                                  ? memory.content
                                  : JSON.stringify(memory.content, null, 2)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMemory(memory.id)}
                              className="text-gray-400 hover:text-red-400 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
