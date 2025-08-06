'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSmartMemory } from '@/hooks/use-smart-memory'
import { Search, Brain, TrendingUp, Users, MessageSquare, Star, Trash2, Edit, ThumbsUp, ThumbsDown, Filter, BarChart3 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Memory } from '@/types/memory'

const MEMORY_TYPES = [
  { value: 'personal_info', label: '개인정보', color: 'bg-blue-100 text-blue-800' },
  { value: 'preferences', label: '선호도', color: 'bg-green-100 text-green-800' },
  { value: 'goals', label: '목표', color: 'bg-purple-100 text-purple-800' },
  { value: 'experiences', label: '경험', color: 'bg-orange-100 text-orange-800' },
  { value: 'relationships', label: '관계', color: 'bg-pink-100 text-pink-800' },
  { value: 'context', label: '맥락', color: 'bg-gray-100 text-gray-800' },
  { value: 'other', label: '기타', color: 'bg-yellow-100 text-yellow-800' }
]

const QUALITY_LEVELS = [
  { min: 0.8, label: '최고', color: 'text-green-600', bgColor: 'bg-green-100' },
  { min: 0.6, label: '좋음', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { min: 0.4, label: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { min: 0.0, label: '낮음', color: 'text-red-600', bgColor: 'bg-red-100' }
]

function getQualityLevel(score: number) {
  return QUALITY_LEVELS.find(level => score >= level.min) || QUALITY_LEVELS[QUALITY_LEVELS.length - 1]
}

function getMemoryTypeInfo(type: string) {
  return MEMORY_TYPES.find(t => t.value === type) || MEMORY_TYPES[MEMORY_TYPES.length - 1]
}

export function MemoryDashboard() {
  const {
    memories,
    stats,
    loading,
    error,
    searchMemories,
    saveMemory,
    provideFeedback,
    deleteMemory,
    loadUserMemories,
    loadStats,
    updateMemoryQuality
  } = useSmartMemory()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'quality_score' | 'usage_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [newMemoryContent, setNewMemoryContent] = useState('')
  const [newMemoryType, setNewMemoryType] = useState('personal_info')

  useEffect(() => {
    loadUserMemories({ sortBy, sortOrder })
    loadStats()
  }, [loadUserMemories, loadStats, sortBy, sortOrder])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadUserMemories({ 
        type: selectedType === 'all' ? undefined : selectedType,
        sortBy, 
        sortOrder 
      })
      return
    }

    await searchMemories(searchQuery, {
      types: selectedType === 'all' ? undefined : [selectedType],
      minQuality: 0.0,
      limit: 50
    })
  }

  const handleSaveMemory = async () => {
    if (!newMemoryContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive"
      })
      return
    }

    const success = await saveMemory(newMemoryContent, newMemoryType)
    if (success) {
      setNewMemoryContent('')
      setNewMemoryType('personal_info')
    }
  }

  const handleFeedback = async (memoryId: string, helpful: boolean) => {
    await provideFeedback(memoryId, helpful)
  }

  const handleDelete = async (memoryId: string) => {
    await deleteMemory(memoryId)
  }

  const handleQualityUpdate = async (memoryId: string, newScore: number) => {
    await updateMemoryQuality(memoryId, newScore)
    setEditingMemory(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            스마트 메모리 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">
            AI가 기억하는 당신의 모든 정보를 관리하세요
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 메모리</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_memories}</div>
              <p className="text-xs text-muted-foreground">
                평균 품질: {(stats.average_quality_score * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">고품질 메모리</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.high_quality_count}</div>
              <p className="text-xs text-muted-foreground">
                전체의 {((Number(stats.high_quality_count) / Number(stats.total_memories)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용량</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_usage_count}</div>
              <p className="text-xs text-muted-foreground">
                메모리 참조 횟수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">품질 분포</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>고품질</span>
                  <span>{stats.quality_distribution.high}</span>
                </div>
                <Progress 
                  value={(Number(stats.quality_distribution.high) / Number(stats.total_memories)) * 100} 
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="memories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memories">메모리 관리</TabsTrigger>
          <TabsTrigger value="add">새 메모리 추가</TabsTrigger>
          <TabsTrigger value="analytics">분석</TabsTrigger>
        </TabsList>

        <TabsContent value="memories" className="space-y-4">
          {/* 검색 및 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">메모리 검색 및 필터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="메모리 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 타입</SelectItem>
                      {MEMORY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">생성일</SelectItem>
                      <SelectItem value="quality_score">품질</SelectItem>
                      <SelectItem value="usage_count">사용량</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">내림차순</SelectItem>
                      <SelectItem value="asc">오름차순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 메모리 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>메모리 목록 ({memories.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">로딩 중...</p>
                    </div>
                  ) : memories.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">저장된 메모리가 없습니다.</p>
                    </div>
                  ) : (
                    memories.map((memory) => {
                      const typeInfo = getMemoryTypeInfo(memory.type)
                      const qualityLevel = getQualityLevel(memory.quality_score)

                      return (
                        <Card key={memory.id} className="relative">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={typeInfo.color}>
                                    {typeInfo.label}
                                  </Badge>
                                  <Badge variant="outline" className={qualityLevel.color}>
                                    품질: {qualityLevel.label} ({(memory.quality_score * 100).toFixed(0)}%)
                                  </Badge>
                                  <Badge variant="secondary">
                                    사용: {memory.usage_count}회
                                  </Badge>
                                </div>
                                
                                <p className="text-sm mb-3 leading-relaxed">
                                  {memory.content}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>생성: {formatDate(memory.created_at)}</span>
                                  {memory.last_referenced && (
                                    <span>마지막 사용: {formatDate(memory.last_referenced)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFeedback(memory.id, true)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFeedback(memory.id, false)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingMemory(memory)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>품질 점수 수정</DialogTitle>
                                      <DialogDescription>
                                        이 메모리의 품질 점수를 조정하세요 (0.0 - 1.0)
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium">현재 점수: {memory.quality_score.toFixed(2)}</label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="1"
                                          step="0.1"
                                          defaultValue={memory.quality_score}
                                          onChange={(e) => {
                                            const newScore = parseFloat(e.target.value)
                                            if (newScore >= 0 && newScore <= 1) {
                                              handleQualityUpdate(memory.id, newScore)
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
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
                                      <AlertDialogAction
                                        onClick={() => handleDelete(memory.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        삭제
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>새 메모리 추가</CardTitle>
              <CardDescription>
                중요한 정보를 직접 추가하여 AI가 기억하도록 할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">메모리 타입</label>
                <Select value={newMemoryType} onValueChange={setNewMemoryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">내용</label>
                <Textarea
                  placeholder="기억하고 싶은 정보를 입력하세요..."
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveMemory} disabled={loading || !newMemoryContent.trim()}>
                {loading ? '저장 중...' : '메모리 저장'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>타입별 분포</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.memories_by_type || {}).map(([type, count]) => {
                        const typeInfo = getMemoryTypeInfo(type)
                        const percentage = (Number(count) / Number(stats.total_memories)) * 100
                        
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={typeInfo.color} variant="secondary">
                                {typeInfo.label}
                              </Badge>
                              <span className="text-sm">{count}개</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={percentage} className="w-20 h-2" />
                              <span className="text-xs text-muted-foreground w-12">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>품질 분포</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.quality_distribution || {}).map(([level, count]) => {
                        const percentage = (Number(count) / Number(stats.total_memories)) * 100
                        const levelInfo = level === 'high' ? 
                          { label: '고품질', color: 'text-green-600' } :
                          level === 'medium' ?
                          { label: '보통', color: 'text-yellow-600' } :
                          { label: '낮음', color: 'text-red-600' }
                        
                        return (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${levelInfo.color}`}>
                                {levelInfo.label}
                              </span>
                              <span className="text-sm">{count}개</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={percentage} className="w-20 h-2" />
                              <span className="text-xs text-muted-foreground w-12">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
